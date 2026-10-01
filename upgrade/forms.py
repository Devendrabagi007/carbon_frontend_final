from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User

class SignupForm(UserCreationForm):
    first_name = forms.CharField(max_length=60, label='Your name')
    email = forms.EmailField(label='Email address')
    class Meta:
        model = User
        fields = ('first_name', 'username', 'email', 'password1', 'password2')
    def clean_username(self):
        value = self.cleaned_data['username'].strip().lower()
        if User.objects.filter(username__iexact=value).exists():
            raise forms.ValidationError('This username is already taken.')
        return value
    def clean_email(self):
        return self.cleaned_data['email'].strip().lower()
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            field.widget.attrs['autocomplete'] = {'first_name':'given-name', 'email':'email', 'username':'username'}.get(name, 'new-password')
        self.fields['username'].help_text = 'Letters, numbers and @ . + - _ only.'
        self.fields['password1'].help_text = 'Use at least 8 characters. Avoid common passwords and personal details.'
        self.fields['password2'].help_text = ''

class LoginForm(AuthenticationForm):
    def clean_username(self):
        return self.cleaned_data['username'].strip().lower()
