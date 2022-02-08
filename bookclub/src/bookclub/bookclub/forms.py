from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from bookclub.models import Profile

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
            'picture': forms.FileInput(attrs = {'id': 'id_profile_picture'})
        }
        labels = { 
            'bio': "",
            'picture': "Upload image"
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