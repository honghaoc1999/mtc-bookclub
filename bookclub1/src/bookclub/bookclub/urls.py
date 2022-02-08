from django.urls import path
from .views import videochat_view
from bookclub import views

urlpatterns = [
    # for AJAX
    path('get-global', views.get_global),
    path('get-follower', views.get_follower),
    path('add-comment', views.add_comment, name="ajax-add-comment")
]
