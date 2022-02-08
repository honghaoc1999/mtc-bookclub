from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Post(models.Model):
    text = models.CharField(max_length=200)
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT)
    creation_time = models.DateTimeField()
    pdf = models.FileField(blank=True)
    content_type = models.CharField(max_length=50)
    room_id = models.IntegerField(default=-1)
    def __str__(self):
        return "id: "+str(self.id)+"book_title: "+str(self.book_title)

class Profile(models.Model):
    bio = models.CharField(max_length=200)
    user = models.OneToOneField(User, on_delete=models.PROTECT)
    picture = models.FileField(blank=True)
    content_type = models.CharField(max_length=50)
    following = models.ManyToManyField(User, related_name="followers")
    access_role = models.CharField(max_length=200, default='regular user')
    def __str__(self):
        return 'Profile(id=' + str(self.id) + ', ' + 'access_role=' + str(self.access_role)+', ' + 'name=' + str(self.user)+')'


class Comment(models.Model):
    text = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    creation_time = models.DateTimeField()
    post = models.ForeignKey(Post, on_delete=models.PROTECT, related_name="post_comments")

class Room(models.Model):
    book_title = models.CharField(max_length=50, unique=True)
    book_description = models.CharField(max_length=200)
    book_author = models.CharField(max_length=50)
    book_cover = models.FileField(blank=True)
    content_type = models.CharField(max_length=50)
    admin = models.CharField(max_length=200)
    def __str__(self):
        return str(self.book_title)
