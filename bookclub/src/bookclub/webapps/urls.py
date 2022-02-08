"""webapps URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from bookclub import views

urlpatterns = [
    # new
    path('', views.videochat_view, name='videochat_view'),
    # basic views
    path('landing', views.login_action, name='login'),
    path('logout', views.logout_action, name="logout"),
    path('register', views.register_action, name='register'),
    path('globalstream', views.global_stream, name='global_stream'),
    path('followerstream', views.follower_stream, name="follower_stream"),
    path('userprofile', views.user_profile, name="user_profile"),
    path('otherprofile/<int:other_user_id>', views.other_profile, name="other_profile"),
    path('photo/<int:id>', views.get_photo, name="photo"),
    path('follow/<int:id>', views.follow_action, name="follow"),
    path('unfollow/<int:id>', views.unfollow_action, name="unfollow"),
    # AJAX
    path('bookclub/', include('bookclub.urls'))
]
