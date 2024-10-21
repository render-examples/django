from django import forms
from django.db.models import Count
# from django.db.models import Q

from .models import * 

#Form for querying seal impressions
repositories_options = [('','None')]
series_options = [('', 'None')]
location_options = [('', 'None')]
nature_options = [('', 'None')]
representation_options = [('', 'None')]
timegroup_options = [('', 'None')]
shape_options = [('', 'None')]
classname_options = [('', 'None')]
group_options = [('', 'None')]

for e in Repository.objects.order_by('repository_fulltitle'):
	repositories_options.append((e.fk_repository, e.repository_fulltitle))

for e in Series.objects.order_by('series_name').distinct('series_name'):
	appendvalue = str(e.fk_repository) + " : " + e.series_name
	series_options.append((e.pk_series, appendvalue))

for e in Printgroup.objects.order_by('printgroup_order'):
	group_options.append((e.pk_printgroup, e.printgroup))

for e in Region.objects.order_by('region_label').distinct('region_label'):
	location_options.append((e.pk_region, e.region_label))

for e in Nature.objects.order_by('nature_name').distinct('nature_name'):
	nature_options.append((e.pk_nature, e.nature_name))

for e in RepresentationType.objects.order_by('representation_type').distinct('representation_type').exclude(pk_representation_type=5):
	representation_options.append((e.pk_representation_type, e.representation_type))
	
for e in TimegroupC.objects.order_by('pk_timegroup_c'):
	timegroup_options.append((e.timegroup_c, e.timegroup_c_range))

for e in Shape.objects.order_by('shape').distinct('shape'):
	shape_options.append((e.pk_shape, e.shape))

for e in Terminology.objects.filter(term_type=1).order_by('term_name').distinct('term_name'):
	classname_options.append((e.id_term, e.term_name))

class ManifestationForm(forms.Form):
	repository = forms.ChoiceField(choices=repositories_options, required=False)
	series = forms.ChoiceField(choices=series_options, required=False, initial={'': 'None'})	
	location = forms.ChoiceField(choices=location_options, required=False, initial={'':'None'})
	nature = forms.ChoiceField(label='Object', choices=nature_options, required=False)
	representation = forms.ChoiceField(choices=representation_options, required=False, initial={'': 'None'})
	timegroup = forms.ChoiceField(label='Period', choices=timegroup_options, required=False)
	shape = forms.ChoiceField(choices=shape_options, required=False, initial={'': 'None'})
	name = forms.CharField(label='Identifier', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: BA 867 box 21'}))
	classname = forms.ChoiceField(label='Digisig Class', choices=classname_options, required=False)
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)
	group = forms.ChoiceField(choices=group_options, required=False, initial={'': 'None'})

class PageCycleForm(forms.Form):
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)


#Form for collections, map and time analysis

collections_options = [('30000287', 'All Collections')]
graphchoices = [('1', 'Seal Descriptions'), ('2', 'Seal Impressions, Matrices and Casts')]
mapchoices = [('1', 'Places'), ('2', 'Counties'), ('3', 'Regions')]
sealtype_options = [('', 'None')]
period_options = [('', 'None')]
timegroup_options2 = []


for e in Collection.objects.order_by('collection_shorttitle'):
	collections_options.append((e.id_collection, e.collection_shorttitle))

for e in Sealtype.objects.order_by('sealtype_name'):
	sealtype_options.append((e.id_sealtype, e.sealtype_name))

for e in TimegroupC.objects.order_by('pk_timegroup_c'):
	timegroup_options2.append((e.pk_timegroup_c, e.timegroup_c_range))

class CollectionForm(forms.Form):
	collection = forms.ChoiceField(choices=collections_options, required=False)
	#graphchoice = forms.ChoiceField(choices=graphchoices, required=False)
	mapchoice = forms.ChoiceField(choices=mapchoices, required=False)
	timechoice = forms.ChoiceField(choices=timegroup_options2, required=False)
	# classname = forms.ChoiceField(label='Digisig Class', choices=classname_options, required=False)
	sealtypechoice = forms.ChoiceField(choices=sealtype_options, required=False)


#Form for quering seal descriptions

collections_options = [('30000287', 'All Collections')]

for e in Collection.objects.order_by('collection_shorttitle').annotate(numdescriptions=Count('sealdescription')):

	if (e.numdescriptions > 0):
		collections_options.append((e.id_collection, e.collection_shorttitle))

class SealdescriptionForm(forms.Form):
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)
	collection = forms.ChoiceField(choices=collections_options, required=False)
	cataloguecode = forms.CharField(label='Entry', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: P281'}))
	#cataloguedescription = forms.CharField(label='Description', max_length=100, required=False)
	cataloguemotif = forms.CharField(label='Motif Description', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: lily'}))
	cataloguename = forms.CharField(label='Person/Entity', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: John son of Robert'}))


#Form for Actor search

Choices = [('0', 'None'), ('1', 'Individual'), ('2', 'Corporate')]

personclass_options = []
personorder_options = []

for e in Groupclass.objects.order_by('groupclass'):
	personclass_options.append((e.fk_group_class, e.groupclass))

for e in Grouporder.objects.order_by('grouporder'):
	personorder_options.append((e.fk_group_order, e.grouporder))

class PeopleForm(forms.Form):
	name = forms.CharField(label='id_name', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: John'}))
	group = forms.ChoiceField(choices=Choices, required=False)
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)
	personclass = forms.ChoiceField(choices=personclass_options, required=False)
	personorder = forms.ChoiceField(choices=personorder_options, required=False) 



#Nb: a search seal form uses a limited number of series and repositories -- but need all for this form
series_all_options = [('', 'None')]
repositories_all_options = [('', 'None')]

for e in Series.objects.exclude(series_name__istartswith="z").order_by('fk_repository'):
	repository = e.fk_repository
	appendvalue = repository.repository + " : " + e.series_name
	series_all_options.append((e.pk_series, appendvalue))

for e in Repository.objects.order_by('repository_fulltitle'):
	repositories_options.append((e.fk_repository, e.repository_fulltitle))

class ItemForm(forms.Form):
	series = forms.ChoiceField(label='series', choices=series_all_options, required=False, initial={'': 'None'})
	repository = forms.ChoiceField(label='repositories', choices=repositories_options, required=False, initial={'': 'None'})
	shelfmark = forms.CharField(label='shelfmark', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: 867'}))
	searchphrase = forms.CharField(label='searchphrase', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: Matilda'}))
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)


# Form for place search
county_options = [('0', 'None')]
regionoptions = [('0', 'None')]

for e in Region.objects.filter(location__isnull=False).filter(fk_locationtype=4).order_by('region_label').distinct('region_label'):
	county_options.append((e.pk_region, e.region_label))

for e in Regiondisplay.objects.filter(region__location__isnull=False).order_by('regiondisplay_label').distinct('regiondisplay_label'):
	regionoptions.append((e.id_regiondisplay, e.regiondisplay_label))

class PlaceForm(forms.Form):
	county = forms.ChoiceField(choices=county_options, required=False)
	region = forms.ChoiceField(choices=regionoptions, required=False)
	location_name = forms.CharField(label='location_name', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: Bruges'}))	
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)


# Form for Date search

class DateForm(forms.Form):
	classname = forms.ChoiceField(label='Digisig Class', choices=classname_options, required=True)
	shape = forms.ChoiceField(choices=shape_options, required=True, initial={'': 'None'})
	face_vertical = forms.IntegerField(label='vertical',required=True)
	face_horizontal = forms.IntegerField(label='horizontal',required=True)	


#Form for ML date prediction analysis

classification_options = []
collection2_options = []

## this is a very bad way of selecting the classifications in use -- 2023_9_23
for e in Classification.objects.exclude(class_name__startswith="z").exclude(class_name__startswith="Z").order_by('class_sortorder'):
	classification_options.append((e.id_class, e.class_name))

for e in Collection.objects.filter(id_collection=30000047).order_by('id_collection'):
	collection2_options.append((e.id_collection, e.collection_title))
	#### forcing addition of Linenthal --- 2023_9_26
	collection2_options.append((30000337, 'Linenthal, Schoyen Collection'))

class MLpredictionForm(forms.Form):
	classification = forms.ChoiceField(choices=classification_options, required=False)
	collection2 = forms.ChoiceField(choices=collection2_options, required=False)


# For for parish selection

for e in Location.objects.filter(fk_locationtype=1, fk_region=87).order_by('location')

class ParishForm(forms.Form):
	londonparish = forms.ChoiceField(label='London Parish', choices=londonparishes_options, required=True)