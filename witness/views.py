from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time
# from django.core.paginator import Paginator
from django.db.models import Prefetch
from django.db.models import Q, F
from django.db.models import Count
from django.db.models import Sum
# from django.db.models.functions import Concat
# from django.db.models import CharField
from django.core import serializers
from django.db.models import IntegerField, Value


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

    sourcevalue = 10000029

    graphdata = {}

    personprimeevents = Referenceindividual.objects.filter(fk_individual=sourcevalue, fk_referencerole=1).values('fk_event')

    personlinks = Referenceindividual.objects.filter(
        fk_event__in=personprimeevents, fk_referencerole=1).values(target=F('fk_individual'))[:5]

    nodesset= personlinks.annotate(source=Value(sourcevalue, output_field=IntegerField()))

    graphdata["nodes"] = json.dumps(list(nodesset))

    individual_set = Individual.objects.filter(
        id_individual__in=personlinks).exclude(id_individual=10000019).values(
        id=F('id_individual'), name=F('fullname_original')).annotate(
        val=Count("id_individual"))[:5]

    graphdata["links"] = json.dumps(list(individual_set))

    print (graphdata)

    # graphdata = {"nodes": [{"id":"id1","name":"name1","val": 1},{"id":"id2","name":"name2","val": 10}],"links":[{"source":"id1","target":"id2"}]}

    graphdata = {'nodes': [{"target": 10002629, "source": 10000029}, {"target": 10005089, "source": 10000029}, {"target": 10000069, "source": 10000029}, {"target": 10000329, "source": 10000029}, {"target": 10001029, "source": 10000029}], 'links': [{"id": 10000069, "name": "John de Gisors", "val": 1}, {"id": 10000329, "name": "Michael Tovy", "val": 1}, {"id": 10001029, "name": "Ralph Ashwy, Civis London", "val": 1}, {"id": 10002629, "name": "Robert Montpellier", "val": 1}, {"id": 10005089, "name": "John Calf, Fishmonger", "val": 1}]}

    template = loader.get_template('witness/graph.html')
    context = {'graphdata': graphdata}
    return HttpResponse(template.render(context, request))