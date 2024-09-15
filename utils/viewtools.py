from digisig.models import * 
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from django.core.paginator import Paginator

from time import time


def individualsearch(digisig_entity_number):

	individual_object = Individual.objects.select_related(
	'fk_group').select_related(
	'fk_descriptor_title').select_related(
	'fk_descriptor_name').select_related(
	'fk_descriptor_prefix1').select_related(
	'fk_descriptor_descriptor1').select_related(
	'fk_separator_1').select_related(
	'fk_descriptor_prefix2').select_related(
	'fk_descriptor_descriptor2').select_related(
	'fk_descriptor_prefix3').select_related(
	'fk_descriptor_descriptor3').select_related(
	'fk_group__fk_group_order').select_related(
	'fk_group__fk_group_class').get(id_individual=digisig_entity_number)

	return(individual_object)


def sealsearch():
	manifestation_object = Manifestation.objects.all().select_related(
	'fk_face__fk_seal').select_related(
	'fk_support__fk_part__fk_item__fk_repository').select_related(
	'fk_support__fk_number_currentposition').select_related(
	'fk_support__fk_attachment').select_related(
	'fk_support__fk_supportstatus').select_related(
	'fk_support__fk_nature').select_related(
	'fk_imagestate').select_related(
	'fk_position').select_related(
	'fk_support__fk_part__fk_event').order_by(
	'id_manifestation').prefetch_related(
	Prefetch('fk_manifestation', queryset=Representation.objects.filter(primacy=1)))

	return(manifestation_object)

def sealsearchfilter(manifestation_object, form):
	qrepository = form.cleaned_data['repository']   
	qseries = form.cleaned_data['series']
	qrepresentation_type = form.cleaned_data['representation']
	qnature = form.cleaned_data['nature']
	qlocation = form.cleaned_data['location']
	qtimegroup = form.cleaned_data['timegroup']
	qshape = form.cleaned_data['shape']
	qshelfmark = form.cleaned_data['name']
	qclassname = form.cleaned_data['classname']
	qpagination = form.cleaned_data['pagination']
	qgroup = form.cleaned_data['group']

	if qrepository.isdigit():
		if int(qrepository) > 0:
			manifestation_object = manifestation_object.filter(
				fk_support__fk_part__fk_item__fk_repository=qrepository)

	if qseries.isdigit():
		if int(qseries) > 0:
			manifestation_object = manifestation_object.filter(
				fk_support__fk_part__fk_item__fk_series=qseries)

	if qrepresentation_type.isdigit():
		if int(qrepresentation_type) > 0:
			manifestation_object = manifestation_object.filter(
				fk_manifestation__fk_representation_type=qrepresentation_type)

	if qnature.isdigit():
		if int(qnature) > 0:
			manifestation_object = manifestation_object.filter(
				fk_support__fk_nature=qnature)

	if qlocation.isdigit():
		if int(qlocation) > 0:
			manifestation_object = manifestation_object.filter(
				fk_support__fk_part__fk_event__locationreference__fk_locationname__fk_location__fk_region=qlocation)

	# if qtimegroup.isdigit():
	# 	if int(qtimegroup) > 0:
	# 		temporalperiod_target = (TimegroupA.objects.get(pk_timegroup_a = qtimegroup))   
	# 		yearstart = (temporalperiod_target.timegroup_a_startdate)
	# 		manifestation_object = manifestation_object.filter(
	# 			fk_support__fk_part__fk_event__repository_startdate__lt=datetime.strptime(str(yearstart), "%Y")).filter(
	# 			fk_support__fk_part__fk_event__repository_enddate__gt=datetime.strptime(str(yearstart+50), "%Y"))

	if qshape.isdigit():
		if int(qshape) > 0:
			manifestation_object = manifestation_object.filter(
				fk_face__fk_shape=qshape)

	if qgroup.isdigit():
		if int(qgroup) > 0:
			manifestation_object = manifestation_object.filter(
				fk_face__fk_seal__fk_printgroup=qgroup)

	if qclassname.isdigit():
		if int(qclassname) > 0:
			searchclassification =  Classification.objects.get(id_class = qclassname)
			manifestation_object = manifestation_object.filter(
				fk_face__fk_class__level1=searchclassification.level1)

			if searchclassification.level2 > 0:
				manifestation_object = manifestation_object.filter(
				fk_face__fk_class__level2=searchclassification.level2)

				if searchclassification.level3 > 0:
					manifestation_object = manifestation_object.filter(
					fk_face__fk_class__level3=searchclassification.level3)

					if searchclassification.level4 > 0:
						manifestation_object = manifestation_object.filter(
						fk_face__fk_class__level4=searchclassification.level4)

						if searchclassification.level5 > 0:
							manifestation_object = manifestation_object.filter(
							fk_face__fk_class__level5=searchclassification.level5)

							if searchclassification.level6 > 0:
								manifestation_object = manifestation_object.filter(
								fk_face__fk_class__level6=searchclassification.level6)

								if searchclassification.level7 > 0:
									manifestation_object = manifestation_object.filter(
									fk_face__fk_class__level7=searchclassification.level7)

	if len(qshelfmark) > 0:
		manifestation_object = manifestation_object.filter(
		fk_support__fk_part__fk_item__shelfmark__icontains=qshelfmark)

	if qpagination < 1: qapgination =1 

	return(manifestation_object, qpagination)

def sealsearchpagination(manifestation_object, qpagination):

	manifestation_object = Paginator(manifestation_object, 10).page(qpagination)
	totalrows = manifestation_object.paginator.count
	totaldisplay = str(manifestation_object.start_index()) + "-" + str(manifestation_object.end_index())

	return(manifestation_object, totalrows, totaldisplay, qpagination)

# information for presenting a seal manifestation {{should be defunct?}}
def sealsearchmanifestationmetadata(manifestation_object):

	manifestation_set = {}

	#https://medium.com/codeptivesolutions/prefetch-related-and-select-related-in-django-90f07a2379c0
	#manifestation_object2 = manifestation_object.prefetch_related(Prefetch('fk_manifestation', queryset=Representation.objects.filter(primacy=1))).all()

	for e in manifestation_object:
		manifestation_dic = {}
		facevalue = e.fk_face
		sealvalue = facevalue.fk_seal
		supportvalue = e.fk_support
		numbervalue = supportvalue.fk_number_currentposition
		partvalue = supportvalue.fk_part
		eventvalue = partvalue.fk_event
		itemvalue = partvalue.fk_item
		repositoryvalue = itemvalue.fk_repository

		try:
			representation_set = Representation.objects.select_related('fk_connection').get(fk_manifestation=e.id_manifestation, primacy=1)

		except:
			print ("no image available for:", e.id_manifestation)
			representation_set = Representation.objects.select_related('fk_connection').get(id_representation=12204474)

		connection = representation_set.fk_connection
		manifestation_dic["thumb"] = connection.thumb
		manifestation_dic["medium"] = connection.medium
		manifestation_dic["representation_thumbnail_hash"] = representation_set.representation_thumbnail_hash
		manifestation_dic["representation_filename_hash"] = representation_set.representation_filename_hash 
		manifestation_dic["id_representation"] = representation_set.id_representation

		sealdescription_set = Sealdescription.objects.filter(fk_seal=facevalue.fk_seal).select_related('fk_collection')
		manifestation_dic["sealdescriptions"] = sealdescription_set

		manifestation_dic["manifestation"] = e
		manifestation_dic["id_manifestation"] = e.id_manifestation
		manifestation_dic["fk_position"] = e.fk_position

		manifestation_dic["id_seal"] = sealvalue.id_seal
		manifestation_dic["id_item"] = itemvalue.id_item
		manifestation_dic["repository_fulltitle"] = repositoryvalue.repository_fulltitle
		manifestation_dic["shelfmark"] = itemvalue.shelfmark
		manifestation_dic["fk_supportstatus"] = supportvalue.fk_supportstatus
		manifestation_dic["fk_attachment"] = supportvalue.fk_attachment		
		manifestation_dic["number"] = numbervalue.number
		manifestation_dic["support_type"] = supportvalue.fk_nature
		manifestation_dic["label_manifestation_repository"] = e.label_manifestation_repository
		manifestation_dic["imagestate_term"] = e.fk_imagestate
		manifestation_dic["partvalue"] = partvalue.id_part

		#take the repository submitted date in preference to the Digisig date
		if eventvalue.repository_startdate:
			manifestation_dic["repository_startdate"] = eventvalue.repository_startdate
		else:
			manifestation_dic["repository_startdate"] = eventvalue.startdate 

		if eventvalue.repository_enddate:
			manifestation_dic["repository_enddate"] = eventvalue.repository_enddate
		else:
			manifestation_dic["repository_enddate"] = eventvalue.enddate

		locationreference = Locationreference.objects.select_related('fk_locationname__fk_location').get(fk_event=eventvalue.pk_event,fk_locationstatus=1)

		locationname= locationreference.fk_locationname
		location = locationreference.fk_locationname.fk_location
		manifestation_dic["repository_location"] = locationreference.fk_locationname.fk_location.location
		manifestation_dic["id_location"] = locationreference.fk_locationname.fk_location.id_location

		manifestation_set[e.id_manifestation] = manifestation_dic

	return (manifestation_set)


def	manifestation_fetchrepresentations(e, manifestation_dic):

	try:
		representation_set = Representation.objects.select_related('fk_connection').get(fk_manifestation=e.id_manifestation, primacy=1)

	except:
		print ("no image available for:", e.id_manifestation)
		representation_set = Representation.objects.select_related('fk_connection').get(id_representation=12204474)

	manifestation_dic["thumb"] = representation_set.fk_connection.thumb
	manifestation_dic["medium"] = representation_set.fk_connection.medium
	manifestation_dic["representation_thumbnail_hash"] = representation_set.representation_thumbnail_hash
	manifestation_dic["representation_filename_hash"] = representation_set.representation_filename_hash 
	manifestation_dic["id_representation"] = representation_set.id_representation

	return(manifestation_dic)


def manifestation_fetchsealdescriptions(e, manifestation_dic):
	sealdescription_set = Sealdescription.objects.filter(fk_seal=e.fk_face.fk_seal).select_related('fk_collection')

	description_set = {}

	for s in sealdescription_set:
		description = {}
		description["sealdescription_id"] = s.id_sealdescription
		description["collection"] = s.fk_collection
		description["identifier"] = s.sealdescription_identifier

		description_set[s.id_sealdescription] = description

	manifestation_dic["sealdescriptions"] = description_set
	
	return(manifestation_dic)

def manifestation_fetchlocations(e, manifestation_dic):
	locationreference = Locationreference.objects.select_related(
		'fk_locationname__fk_location').get(
		fk_event=e.fk_support.fk_part.fk_event,fk_locationstatus=1)
	locationname= locationreference.fk_locationname
	location = locationreference.fk_locationname.fk_location
	manifestation_dic["repository_location"] = locationreference.fk_locationname.fk_location.location
	manifestation_dic["id_location"] = locationreference.fk_locationname.fk_location.id_location

	return (manifestation_dic)

def manifestation_fetchstandardvalues (e, manifestation_dic):
	facevalue = e.fk_face
	sealvalue = facevalue.fk_seal
	supportvalue = e.fk_support
	numbervalue = supportvalue.fk_number_currentposition
	partvalue = supportvalue.fk_part
	eventvalue = partvalue.fk_event
	itemvalue = partvalue.fk_item
	repositoryvalue = itemvalue.fk_repository
	manifestation_dic["manifestation"] = e
	manifestation_dic["id_manifestation"] = e.id_manifestation
	manifestation_dic["fk_position"] = e.fk_position

	manifestation_dic["id_seal"] = sealvalue.id_seal
	manifestation_dic["id_item"] = itemvalue.id_item
	manifestation_dic["repository_fulltitle"] = repositoryvalue.repository_fulltitle
	manifestation_dic["shelfmark"] = itemvalue.shelfmark
	manifestation_dic["fk_supportstatus"] = supportvalue.fk_supportstatus
	manifestation_dic["fk_attachment"] = supportvalue.fk_attachment		
	manifestation_dic["number"] = numbervalue.number
	manifestation_dic["support_type"] = supportvalue.fk_nature
	manifestation_dic["label_manifestation_repository"] = e.label_manifestation_repository
	manifestation_dic["imagestate_term"] = e.fk_imagestate
	manifestation_dic["partvalue"] = partvalue.id_part

	#take the repository submitted date in preference to the Digisig date
	if eventvalue.repository_startdate:
		manifestation_dic["repository_startdate"] = eventvalue.repository_startdate
	else:
		manifestation_dic["repository_startdate"] = eventvalue.startdate 

	if eventvalue.repository_enddate:
		manifestation_dic["repository_enddate"] = eventvalue.repository_enddate
	else:
		manifestation_dic["repository_enddate"] = eventvalue.enddate

	return (manifestation_dic)


#information for presenting a seal
def sealmetadata(digisig_entity_number):
	seal_info = {}

	face_set = Face.objects.filter(fk_seal=digisig_entity_number).select_related(
		'fk_seal__fk_individual_realizer__fk_group').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_title').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_name').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_prefix1').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_descriptor1').select_related(
		'fk_seal__fk_individual_realizer__fk_separator_1').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_prefix2').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_descriptor2').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_prefix3').select_related(
		'fk_seal__fk_individual_realizer__fk_descriptor_descriptor3').select_related(
		'fk_class')

	face_obverse = face_set.get(fk_faceterm=1)

	seal_info["seal"] = face_obverse.fk_seal
	seal_info["sealdescription_set"]= Sealdescription.objects.filter(fk_seal=digisig_entity_number).select_related('fk_collection')
	seal_info["actor"] = face_obverse.fk_seal.fk_individual_realizer

	return (seal_info, face_set, face_obverse)

#information for class value
def sealinfo_classvalue (face_case):
	
	classvalue = {}

	try:
		classvalue["level1"] = Classification.objects.get(class_number=face_case.fk_class.level1)
	except: 
		print("level1 unassigned")

	try:
		if face_case.fk_class.level2 > 0:
			faceclass2 = Classification.objects.get(class_number=face_case.fk_class.level2)
			classvalue["level2"] = faceclass2			
	except: 
		print("level2 unassigned")

	try:
		if face_case.fk_class.level3 > 0:
			faceclass3 = Classification.objects.get(class_number=face_case.fk_class.level3)
			classvalue["level3"] = faceclass3 			
	except: 
		print("level3 unassigned")

	try:
		if face_case.fk_class.level4 > 0:
			faceclass4 = Classification.objects.get(class_number=face_case.fk_class.level4)
			classvalue["level4"] = faceclass4
	except: 
		print("level4 unassigned")

	try:
		if face_case.fk_class.level5 > 0:
			faceclass5 = Classification.objects.get(class_number=face_case.fk_class.level5)
			classvalue["level5"] = faceclass5			
	except: 
		print("level5 unassigned")			

	return(classvalue)

def namecompiler(individual_object):

	namevariable = ''
	if (individual_object.fk_group != None): namevariable = individual_object.fk_group.group_name
	if (individual_object.fk_descriptor_title != None): namevariable = namevariable + " " + individual_object.fk_descriptor_title.descriptor_modern
	if (individual_object.fk_descriptor_name != None): namevariable = namevariable + " " + individual_object.fk_descriptor_name.descriptor_modern
	if (individual_object.fk_descriptor_prefix1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix1.prefix_english
	if (individual_object.fk_descriptor_descriptor1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor1.descriptor_modern
	if (individual_object.fk_descriptor_prefix2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix2.prefix_english
	if (individual_object.fk_descriptor_descriptor2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor2.descriptor_modern
	if (individual_object.fk_descriptor_prefix3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix3.prefix_english
	if (individual_object.fk_descriptor_descriptor3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor3.descriptor_modern
	nameout = namevariable.strip()

	return(nameout)

#gets event set
def eventset_datedata(event_object, event_dic):

	if event_object.repository_startdate is not None: 
		yeartemp = event_object.repository_startdate
		event_dic["year1"] = yeartemp.year
		if event_object.repository_enddate is not None: 
			yeartemp = event_object.repository_enddate
			event_dic["year2"] = yeartemp.year

	if event_object.startdate is not None:
		yeartemp = event_object.startdate
		event_dic["year3"] = yeartemp.year
		if event_object.enddate is not None: 
			yeartemp = event_object.enddate
			event_dic["year4"] = yeartemp.year

	return (event_dic)

def eventset_locationdata(event_object, event_dic):
	if event_object is not None:
		targetlocation = event_object.pk_event
		
		location_object = Location.objects.filter(locationname__locationreference__fk_event=targetlocation, locationname__locationreference__location_reference_primary = False).first()

		location_name = location_object.location
		location_id = location_object.id_location
		location_longitude = str(location_object.longitude)
		location_latitude = str(location_object.latitude)

		location= {"type": "Point", "coordinates":[location_longitude, location_latitude]}
		location_dict = {'location': location_name, 'latitude': location_latitude, 'longitude': location_longitude} 

		event_dic["repository_location"] = event_object.repository_location 
		event_dic["location"] = location_object
		event_dic["location_name"] = location_name 
		event_dic["location_id"] = location_id 
		event_dic["location_latitude"] = location_longitude 
		event_dic["location_latitude"] = location_latitude 

	return (event_dic)

def eventset_references(event_object, event_dic):
	reference_dict = {}
	referenceset = Referenceindividual.objects.filter(
		fk_event=event_object).order_by(
		"fk_referencerole__role_order", "pk_referenceindividual").select_related(
		'fk_individual').select_related(
		'fk_referencerole')

	event_dic["referenceset"] = referenceset

	return(event_dic)

def referenceset_references(individual_object, reference_set):

	reference_dic = Referenceindividual.objects.filter(
		fk_individual=individual_object).select_related(
		'fk_event').select_related(
		'fk_referencerole').order_by(
		"fk_event__startdate", "fk_event__enddate")

	for r in reference_dic:

		reference_row = {}

		#date
		if r.fk_event.startdate != None:
			reference_row['date'] = str(r.fk_event.startdate) + "-" + str(r.fk_event.enddate)
		else:
			if r.fk_event.repository_startdate != None:
				reference_row['date'] = str(r.fk_event.repository_startdate) + " - " + str(r.fk_event.repository_enddate)
		#role
		reference_row["role"] = r.fk_referencerole.referencerole

		#item
		part_object = Part.objects.select_related('fk_item').get(fk_event=r.fk_event)
		reference_row["item_shelfmark"] = part_object.fk_item.shelfmark
		reference_row["item_id"] = part_object.fk_item.id_item

		#location
		locationreference_object = Locationreference.objects.filter(
			location_reference_primary=0).select_related(
			'fk_locationname__fk_location__fk_region').get(
			fk_event=r.fk_event)
		reference_row["region"] = locationreference_object.fk_locationname.fk_location.fk_region
		reference_row["location_id"] = locationreference_object.fk_locationname.fk_location.id_location
		reference_row["location"] = locationreference_object.fk_locationname.fk_location.location

		reference_set[r.pk_referenceindividual] = reference_row

	return(reference_set)
