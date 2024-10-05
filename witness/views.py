from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time
# from django.core.paginator import Paginator
from django.db.models import Prefetch
from django.db.models import Q
from django.db.models import Count
from django.db.models import Sum
# from django.db.models.functions import Concat
# from django.db.models import CharField
from django.core import serializers

from .models import *
from .forms import * 
# from utils.mltools import * 
from utils.generaltools import *
from utils.viewtools import *

import json
import os
import pickle


# Create your views here.
def index(request):

    pagetitle = 'title'
    template = loader.get_template('witness/index.html')

    #### update this to remove databasecall

    londoners_total = Individual.objects.filter(fk_individual_event__gt=1).distinct('id_individual').count()

    # manifestation_total = Manifestation.objects.count()
    # seal_total = Seal.objects.count()
    # #item_total = Support.objects.distinct('fk_part__fk_item').count()
    # item_total = 53408
    # catalogue_total = Sealdescription.objects.count()

    context = {
        'pagetitle': pagetitle,
        'londoners_total': londoners_total,
        }

    return HttpResponse(template.render(context, request))


def graph(request):

    # node1 = 

    # nodes_dic = {}


    #     properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
    #     geometry = {"type": "Point", "coordinates": [value4, value5]}
    #     location = {"type": "Feature", "properties": properties, "geometry": geometry}
    #     placelist.append(location)

    # mapdic["features"] = placelist


    graphdata = {"nodes": [{"id": "id1","name": "name1","val": 1},{"id": "id2","name": "name2","val": 10},],"links": [{"source": "id1","target": "id2"},]}

    template = loader.get_template('witness/graph.html')
    context = {'graphdata': graphdata}
    return HttpResponse(template.render(context, request))