# LIBRARIES
from django.http.response import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ObjectDoesNotExist
import json

# SELF DEFINED
from bookclub.models import Comment, Post, Profile
from bookclub.forms import ProfileForm, RegisterForm, LoginForm

############################
# NEW
############################

def videochat_view(request):
    context = {}
    return render(request, 'bookclub/videochat.html', context)

############################
# BEFORE ENTER APP
############################

def login_action(request):
    context = {};
    if (request.method == "GET"):
        if (request.user.is_authenticated):
            return redirect(reverse('global_stream'))
        else:
            context['form'] = LoginForm();
            return render(request, "login.html", context);
    
    form = LoginForm(request.POST)
    context['form'] = form

    # Validates the form.
    if not form.is_valid():
        return render(request, 'login.html', context)

    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password'])

    login(request, new_user)
    return redirect(reverse('global_stream'))

def logout_action(request): 
    logout(request)
    return redirect(reverse('login'))

def register_action(request):
    context = {};
    if (request.method == "GET"):
        context['form'] = RegisterForm();
        return render(request, "register.html", context);

    form = RegisterForm(request.POST)
    context['form'] = form

     # Validates the form.
    if not form.is_valid():
        return render(request, 'register.html', context)


    # At this point, the form data is valid.  Register and login the user.
    new_user = User.objects.create_user(username=form.cleaned_data['username'], 
                                        password=form.cleaned_data['password'],
                                        email=form.cleaned_data['email'],
                                        first_name=form.cleaned_data['first_name'],
                                        last_name=form.cleaned_data['last_name'])
    new_user.save()

    # Create Profile
    new_profile = Profile(user=new_user, bio="");
    new_profile.save();

    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password'])

    login(request, new_user)


    return redirect(reverse('global_stream'))

############################
# LOGIN REQUIRED
############################

############################
# STREAMS
############################

def _my_json_error_response(message, status=200):
    # You can create your JSON by constructing the string representation yourself (or just use json.dumps)
    response_json = '{ "error": "' + message + '" }'
    return HttpResponse(response_json, content_type='application/json', status=status)

def get_global(request):
    if not request.user.id:
         return _my_json_error_response("You must be logged in to do this operation", status=401)

    response_data = { 
        'posts': [],
        'comments': [],
    }
    for post_item in Post.objects.all():
        my_item = {
            'text': post_item.text,
            'user': post_item.user.username,
            "user_id": post_item.user.id,
            'user_full_name': post_item.user.first_name + " " + post_item.user.last_name,
            'creation_time': str(post_item.creation_time),
            "id": post_item.id,
            'current_user_id': request.user.id,
        }
        response_data['posts'].append(my_item)

    for comment_item in Comment.objects.all():
        my_item = {
            'text': comment_item.text,
            'user': comment_item.user.username,
            'user_full_name': comment_item.user.first_name + " " + comment_item.user.last_name,
            "user_id": comment_item.user.id,
            'creation_time': str(comment_item.creation_time),
            "post_id": comment_item.post.id,
            'id': comment_item.id,
            'current_user_id': request.user.id,
        }
        response_data['comments'].append(my_item)

    response_json = json.dumps(response_data)

    response = HttpResponse(response_json, content_type='application/json', status=200)
    return response

def get_follower(request):
    if not request.user.id:
         return _my_json_error_response("You must be logged in to do this operation", status=401)

    response_data = { 
        'posts': [],
        'comments': [],
    }

    for post_item in Post.objects.all():
        if post_item.user in request.user.profile.following.all():
            my_item = {
                'text': post_item.text,
                'user': post_item.user.username,
                'user_full_name': post_item.user.first_name + " " + post_item.user.last_name,
                "user_id": post_item.user.id,
                'creation_time': str(post_item.creation_time),
                "id": post_item.id,
                'current_user_id': request.user.id,
            }
            response_data['posts'].append(my_item)

    for comment_item in Comment.objects.all():
        if Post.objects.get(id=comment_item.post_id).user in request.user.profile.following.all():
            my_item = {
                'text': comment_item.text,
                'user': comment_item.user.username,
                "user_id": comment_item.user.id,
                'user_full_name': comment_item.user.first_name + " " + comment_item.user.last_name,
                'creation_time': str(comment_item.creation_time),
                "post_id": comment_item.post.id,
                'id': comment_item.id,
                'current_user_id': request.user.id,
            }
            response_data['comments'].append(my_item)

    response_json = json.dumps(response_data)

    response = HttpResponse(response_json, content_type='application/json',status=200)
    return response

def add_comment(request):
    if not request.user.id:
         return _my_json_error_response("You must be logged in to do this operation", status=401)

    if request.method != 'POST':
        return _my_json_error_response("You must use a POST request for this operation", status=405)

    if not 'comment_text' in request.POST or not request.POST['comment_text']:
        return _my_json_error_response("You must enter an item to add.", status=400)

    if not 'post_id' in request.POST or not request.POST['post_id']:
        return _my_json_error_response("You must enter a post id.", status=400)


    comment_text = request.POST['comment_text'];
    post_id = request.POST['post_id'];

    try:
        num = int(post_id);
    except ValueError: 
        return _my_json_error_response("You must enter an integer post id.", status=400)

    print(post_id)

    try:
        post = Post.objects.get(id=post_id)
    except ObjectDoesNotExist:
        return _my_json_error_response("You must enter a valid post id.", status=400)

    print("adding comment", comment_text, "// Post id:", post_id);
    

    new_comment = Comment(text=comment_text, user=request.user, 
        creation_time=timezone.now(), post=Post.objects.get(id=post_id));
    new_comment.save()

    new_json_comment = {
            'text': new_comment.text,
            'user': new_comment.user.username,
            "user_id": new_comment.user.id,
            "user_full_name": new_comment.user.first_name + " " + new_comment.user.last_name,
            'creation_time': str(new_comment.creation_time),
            "post_id": new_comment.post.id,
            'id': new_comment.id,
            'current_user_id': request.user.id,
        }

    # things that needs to be added to html
    response_data = { 
         'posts': [],
        'comments': [new_json_comment]
    }
    response_json = json.dumps(response_data)
    response = HttpResponse(response_json, content_type='application/json', status=200)

    return response


@login_required
def global_stream(request):
    context = {
        'user': request.user,
        'posts': Post.objects.all()
    }
    if request.method == "GET":
        return render(request, 'globalstream.html', context)

    # POST handlers
    
    if 'text' not in request.POST or not request.POST['text']:
        # deal with error
        return render(request, 'error.html', {'errorMessage': "Invalid post without text (global stream). "})

    new_post = Post(text=request.POST['text'], user=request.user, creation_time=timezone.now())
    new_post.save()
    context = {
        'user': request.user,
        'posts': Post.objects.all()
    };
    return render(request, 'globalstream.html', context);

@login_required
def follower_stream(request):
    following_posts_ids = []

    for post in Post.objects.all():
        if post.user in request.user.profile.following.all():
            following_posts_ids.append(post.id)

    context = {
        'user': request.user,
        'posts': Post.objects.filter(id__in=following_posts_ids)
    };
    return render(request, 'followerstream.html', context);


############################
# PROFILES
############################

@login_required
def user_profile(request):
    if request.method == 'GET':
        context = {'profile': request.user.profile,
                   'form': ProfileForm(initial={'bio': request.user.profile.bio}), 
                   'user': request.user}
        return render(request, 'userprofile.html', context);

    # POST handlers
    form = ProfileForm(request.POST, request.FILES)
    if not form.is_valid():
        context = {'profile': request.user.profile, 'form': form, 'user': request.user}
        return render(request, 'userprofile.html', context);

    pic = form.cleaned_data['picture']
    print("uploaded picture: {} (type={})".format(pic, type(pic)))

    if (pic != None):
        request.user.profile.picture = form.cleaned_data['picture'];
        request.user.profile.content_type = form.cleaned_data['picture'].content_type

    request.user.profile.bio = form.cleaned_data['bio'];
    request.user.profile.save();

    context = {'profile': request.user.profile, 'form': form, 'user': request.user}
    return render(request, 'userprofile.html', context)

@login_required
def other_profile(request, other_user_id):
    context = {
        'user': request.user,
        'profile': User.objects.get(id=other_user_id).profile
    }
    return render(request, 'otherprofile.html', context);

@login_required
def get_photo(request, id):
    profile = User.objects.get(id=id).profile;
    item = get_object_or_404(Profile, id=profile.id)
    print('Picture #{} fetched from db: {} (type={})'.format(profile.id, item.picture, type(item.picture)))

    if not item.picture:
        raise Http404

    return HttpResponse(item.picture, content_type=item.content_type)

@login_required 
def follow_action(request, id):
    request.user.profile.following.add(User.objects.get(id=id));
    request.user.profile.save();
    context = {
        'user': request.user,
        'profile': User.objects.get(id=id).profile
    }
    return render(request, 'otherprofile.html', context);

@login_required 
def unfollow_action(request, id):
    request.user.profile.following.remove(User.objects.get(id=id));
    request.user.profile.save();
    context = {
        'user': request.user,
        'profile': User.objects.get(id=id).profile
    }
    return render(request, 'otherprofile.html', context);
