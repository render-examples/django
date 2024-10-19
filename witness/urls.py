from django.urls import path, re_path
from debug_toolbar.toolbar import debug_toolbar_urls

#https://www.valentinog.com/blog/django-vhosts/

#from .views import *

from . import views

urlpatterns = [
	#path("witness/", index, name="index")
	path('', views.index, name='index'),
    path('explore/<str:exploretype>', views.explore, name='explore'),
    path('search/<str:searchtype>', views.search, name='search'),
    path('information/<str:infotype>', views.information, name='information'),
    path('discover/<str:discovertype>', views.discover, name='discover'),
    path('analyze/<str:analysistype>', views.analyze, name='analyze'),
    path('about', views.about, name='about'),
    path('exhibit', views.exhibit, name='exhibit'),
    path('parish', views.parish, name='parish'),
] + debug_toolbar_urls()
# ]
