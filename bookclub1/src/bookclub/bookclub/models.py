from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Post(models.Model):
    text = models.CharField(max_length=200);
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT);
    creation_time = models.DateTimeField();
    pdf = models.FileField(blank=True);

class Profile(models.Model):
    bio = models.CharField(max_length=200)
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    picture = models.FileField(blank=True)
    content_type = models.CharField(max_length=50)
    following = models.ManyToManyField(User, related_name="followers")

class Comment(models.Model):
    text = models.CharField(max_length=200);
    user = models.ForeignKey(User, on_delete=models.PROTECT);
    creation_time = models.DateTimeField();
    post = models.ForeignKey(Post, on_delete=models.PROTECT, related_name="post_comments")

