from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from bookclub.models import Profile, Post, Room

class LoginForm(forms.Form):
    username = forms.CharField(max_length = 20)
    password = forms.CharField(max_length = 200, widget = forms.PasswordInput())

    def clean(self):
        cleaned_data = super().clean()

        # Confirms that the two password fields match
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            raise forms.ValidationError("Invalid username/password")

        # We must return the cleaned data we got from our parent.
        return cleaned_data

class RegisterForm(forms.Form):
    username = forms.CharField(required = True);
    password = forms.CharField(required = True,
                                 widget = forms.PasswordInput());
    confirm_password = forms.CharField(required = True,
                                widget = forms.PasswordInput());
    email = forms.CharField(required = True, widget = forms.EmailInput());
    first_name = forms.CharField(required = True);
    last_name = forms.CharField(required = True);

    # check passwords match
    def clean(self):
        cleaned_data = super().clean();
        password1 = cleaned_data.get('password')
        password2 = cleaned_data.get('confirm_password')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords did not match.")

        # We must return the cleaned data we got from our parent.
        return cleaned_data

    # check username uniqueness
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username__exact=username):
            raise forms.ValidationError("username is already taken.")
        return username

MAX_UPLOAD_SIZE = 2500000

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ('bio', 'picture')
        widgets = {
            'bio': forms.Textarea(attrs={'id': 'id_bio_input_text', 'row':'3'}),
            'picture': forms.FileInput(attrs = {'id': 'id_profile_picture'}),
        }
        labels = {
            'bio': "",
            'picture': "Upload image",
        }

    def clean_picture(self):
        picture = self.cleaned_data['picture']
        if not picture or not hasattr(picture, 'content_type'):
            raise forms.ValidationError('You must upload a picture')
        if not picture.content_type or not picture.content_type.startswith('image'):
            raise forms.ValidationError('File type is not image')
        if picture.size > MAX_UPLOAD_SIZE:
            raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
        return picture

class PostForm(forms.Form):
    text = forms.CharField(widget = forms.Textarea(attrs = {'id': 'id_post_input_text', 'row': '2'}), label = "What did you think about the book?")
    pdf = forms.FileField(widget = forms.FileInput(attrs = {'id': 'id_pdf_input'}), label = "Upload pdf")
    book_id = forms.ModelChoiceField(queryset = Room.objects.all(), label = "Book Title")
        # model = Post
        # fields = ('text', 'pdf', 'book_title')
        # widgets = {
        #     'text': forms.Textarea(attrs = {'id': 'id_post_input_text', 'row': '2'}),
        #     'pdf': forms.FileInput(attrs = {'id': 'id_pdf_input'})
        # }
        # labels = {
        #     'text': "What did you think about the book?",
        #     'pdf': "Upload pdf"
        # }

    def clean_pdf(self):
        pdf = self.cleaned_data['pdf']
        if not pdf:
            raise forms.ValidationError('You must upload a pdf')
        if not hasattr(pdf, 'content_type'):
            raise forms.ValidationError('You must upload a pdf with content type')
        # if not pdf.content_type or not pdf.content_type.startswith('pdf'):
        #     raise forms.ValidationError('File type is not pdf')
        if pdf.size > MAX_UPLOAD_SIZE:
            raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
        return pdf

class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = ('book_title', 'book_author', 'book_description', 'book_cover')
        widgets = {
            'book_title': forms.TextInput(attrs = {'id': 'id_input_book_title'}),
            'book_author': forms.TextInput(attrs = {'id': 'id_input_book_author'}),
            'book_description': forms.Textarea(attrs = {'id': 'id_input_book_description'}),
            'book_cover': forms.FileInput(attrs = {'id': 'id_input_book_cover'})
        }
        labels = {
            'book_title': "Book Title",
            'book_author': "Book Author",
            'book_description': "Summary",
            'book_cover': "Book Cover"
        }

    def clean_book_cover(self):
        book_cover = self.cleaned_data['book_cover']
        if not book_cover or not hasattr(book_cover, 'content_type'):
            raise forms.ValidationError('You must upload a book cover')
        if not book_cover.content_type or not book_cover.content_type.startswith('image'):
            raise forms.ValidationError('File type is not image')
        if book_cover.size > MAX_UPLOAD_SIZE:
            raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
        return book_cover
