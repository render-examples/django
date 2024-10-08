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


    londoners_total = Individual.objects.filter(fk_individual_event__gt=1).distinct('id_individual').count()

    context = {
        'pagetitle': pagetitle,
        'londoners_total': londoners_total,
        }

    return HttpResponse(template.render(context, request))


def graph(request):

    #linkset1 = Digisigrelationshipview.objects.all().values('fk_individual', 'person2')

    personprimeevents = Referenceindividual.objects.filter(fk_individual=10000029, fk_referencerole=1).values('fk_event')

    personlinks = Referenceindividual.objects.filter(
        fk_event__in=personprimeevents, fk_referencerole=1).exclude(
        fk_individual=10000029).values(
        'fk_individual')

    person_set = Individual.objects.filter(id_individual__in=personlinks)

    phrase1 = '[{"id":10000029,"name":"Thomas","val": 1}"'
    phrase2 = "["

    for i in person_set:
        value1 = i.id_individual
        value2 = i.fk_descriptor
        value3 = 1

        phrase1 = phrase1 + ',{"id":"' + value1 + '","name":"' + value2 + '","val": 1}'
        phrase2 = phrase2 + '{"source":' + 10000029,"target":' + value1 +'},'

    graphdata = {"nodes": [{"id":"id1","name":"name1","val": 1},{"id":"id2","name":"name2","val": 10}],"links":[{"source":"id1","target":"id2"}]}

    template = loader.get_template('witness/graph.html')
    context = {'graphdata': graphdata}
    return HttpResponse(template.render(context, request))