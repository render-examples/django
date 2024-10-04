from django.urls import path
from .views import index

#https://www.valentinog.com/blog/django-vhosts/

urlpatterns = [path("witness/", index, name="index")]