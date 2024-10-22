from digisig.models import * 
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from django.core.paginator import Paginator
from django.core import serializers

import statistics
import math
import os
import pandas as pd 

from django.conf import settings

from time import time


#### creates redirect links from generic URLs 
def redirectgenerator(digisig_entity_number, operation, application):

	entitynumber = int(digisig_entity_number)

	if (operation == 1): root = "/page/"
	if (operation == 2): root = "/edit/"
	if (operation == 3): 
		root = "/discover/exhibit/"
		targetphrase = root + str(digisig_entity_number)
		return (targetphrase)		

	finalcharacter = (str(digisig_entity_number))[7:] 

	if finalcharacter == '0': stem = "item/"
	if finalcharacter == '1': stem = "seal/"
	if finalcharacter == '2': stem = "manifestation/"
	if finalcharacter == '3': stem = "sealdescription/"
	if finalcharacter == '4': stem = "representation/"
	if finalcharacter == '5': stem = "support/"
	if finalcharacter == '6': stem = "face/"

	#term=7 (10000007-29999997) collection=7(30000007-49999997) and place=7(higher than 49999997...)	
	if finalcharacter == '7':
		if (entitynumber < 29999997): stem = "term/"
		elif (entitynumber < 49999997): stem = "collection/"
		else: 
			stem = "place/" 
			if application == 2:
				stem = "parish/" 

	#temp workaround -- parts to redirect to item page
	if finalcharacter == '8': 
		stem = "part/"
		part_object = get_object_or_404(Part, id_part=digisig_entity_number)
		digisig_entity_number = part_object.fk_item.id_item

	if finalcharacter == '9':
		stem = "actor/" 
		if application == 2:
			stem = "person/"


	targetphrase = root + stem + str(digisig_entity_number)
	
	return (targetphrase)


def temporaldistribution(timegroupcases):
	#prepare the temporal groups of seals for graph
	timegroupset = TimegroupC.objects.filter(pk_timegroup_c__lt=15).order_by('pk_timegroup_c')
	timecount = {}

	# set the number in each group to 0
	for t in timegroupset:
		timecount.update({t.timegroup_c_range: 0})

	# how many seals belong in each temporal group?
	for case in timegroupcases:

		if case['date_origin'] < 1500 and case['date_origin'] > 999:
			if case['fk_timegroupc'] < 15:
				#number of cases for each time period
				timegroupupdate = case['fk_timegroupc__timegroup_c_range']
				timecount[timegroupupdate] += 1

	labels = []
	data = []

	# determine how many seals should go in each temporal group
	for key, value in timecount.items():
		labels.append(key)
		data.append(value)

	return (labels, data)


def getquantiles(timegroupcases):

	timelist = []
	for t in timegroupcases:

		try:
			timelist.append(int(t['date_origin']))

		except:
			print ("exception", t)

	quantileset = statistics.quantiles(timelist, n=6)

	# print ("timelist", timelist)
	# print ("quantileset", quantileset)

	resultrange = "c." + str(int(quantileset[0])) + "-" + str(int(quantileset[4]))

	return (resultrange, timelist)



def mlpredictcase (class_object, shape_object, case_area, mlmodel):

	data = mldatacase(class_object, shape_object, case_area)
	df = pd.DataFrame(data)

	result = mlmodel.predict(df)
	leaf_id = mlmodel.apply(df)
	finalnode = (list(leaf_id))
	finalnodevalue = finalnode[0]
	result1 = result.item(0)
	resulttext = int(result.item(0))

	return (result, result1, resulttext, finalnodevalue, df)


def mldatacase(class_object, shape_object, resultarea):

	data = { 
		'Round': [shape_object.round],
		'pointedoval': [shape_object.pointedoval],
		'roundedoval': [shape_object.roundedoval],
		'scutiform': [shape_object.scutiform],
		'trianglepointingup': [shape_object.trianglepointingup],
		'unknown': [shape_object.unknown],
		'square': [shape_object.square],
		'lozenge': [shape_object.lozenge],
		'drop': [shape_object.drop],
		'trianglepointingdown': [shape_object.trianglepointingdown],
		'rectangular': [shape_object.rectangular],
		'hexagonal': [shape_object.hexagonal],
		'octagonal': [shape_object.octagonal],
		'abnormal': [shape_object.abnormal],
		'kite': [shape_object.kite],
		'quatrefoil': [shape_object.quatrefoil],
		'size_area': [resultarea],
		'animal': [class_object.animal],
		'human': [class_object.human],
		'objects': [class_object.object_class],
		'device': [class_object.device],
		'beast': [class_object.beast],
		'bird': [class_object.bird],
		'fish': [class_object.fish],
		'insect': [class_object.insect],
		'bust': [class_object.bust],
		'hand': [class_object.hand],
		'boat': [class_object.boat],
		'building': [class_object.building],
		'container': [class_object.container],
		'equipment': [class_object.equipment],
		'naturalproduct': [class_object.naturalproduct],
		'irregular': [class_object.irregular],
		'radial': [class_object.radial],
		'lattice': [class_object.lattice],
		'fulllength': [class_object.fulllength],
		'symbol': [class_object.symbol],
		'hawkhunting': [class_object.hawkhunting],
		'pelicaninpiety': [class_object.pelicaninpiety],
		'headondish': [class_object.headondish],
		'twoheads': [class_object.twoheads],
		'crossedhands': [class_object.crossedhands],
		'handholdingitem': [class_object.handholdingitem],
		'seated': [class_object.seated],
		'standing': [class_object.standing],
		'riding': [class_object.riding],
		'crucified': [class_object.crucified],
		'apparel': [class_object.apparel],
		'crenellation': [class_object.crenellation],
		'tool': [class_object.tool],
		'weapon': [class_object.weapon],
		'Shell': [class_object.shell],
		'wheatsheaf': [class_object.wheatsheaf],
		'stylizedlily': [class_object.stylizedlily],
		'crosses': [class_object.crosses],
		'heart': [class_object.heart],
		'merchantmark': [class_object.merchantmark],
		'texts': [class_object.texts],
		'handholdingbird': [class_object.handholdingbird],
		'halflength': [class_object.halflength],
		'crescent': [class_object.crescent],
		'beastbody': [class_object.beastbody],
		'beasthead': [class_object.beasthead],
		'doubleheadedeagle': [class_object.doubleheadedeagle],
		'horseshoe': [class_object.horseshoe],
		'twobirdsdrinking': [class_object.twobirdsdrinking],
		'animalequipment': [class_object.animalequipment],
		'transport': [class_object.transport],
		'halflengthwomanholdingchild': [class_object.halflengthwomanholdingchild],
		'halflengthwoman': [class_object.halflengthwoman],
		'halflengthman': [class_object.halflengthman],
		'swine': [class_object.swine],
		'boarhead': [class_object.boarhead],
		'centaur': [class_object.centaur],
		'dragon': [class_object.dragon],
		'hare': [class_object.hare],
		'lion': [class_object.lion],
		'lionhead': [class_object.lionhead],
		'mermaid': [class_object.mermaid],
		'squirrel': [class_object.squirrel],
		'stag': [class_object.stag],
		'staghead': [class_object.staghead],
		'unicorn': [class_object.unicorn],
		'unicornhead': [class_object.unicornhead],
		'wolf': [class_object.wolf],
		'wolfhead': [class_object.wolfhead],
		'standingwoman': [class_object.standingwoman],
		'standingman': [class_object.standingman],
		'armouredmanequestrian': [class_object.armouredmanequestrian],
		'seatedwomanholdingchild': [class_object.seatedwomanholdingchild],
		'axe': [class_object.axe],
		'shears': [class_object.shears],
		'arrow': [class_object.arrow],
		'spear': [class_object.spear],
		'sword': [class_object.sword],
		'banner': [class_object.banner],
		'shield': [class_object.shield],
		'christogram': [class_object.christogram],
		'lionfighting': [class_object.lionfighting],
		'sheep': [class_object.sheep],
		'griffin': [class_object.griffin],
		'hammer': [class_object.hammer],
		'standingwomanholdingchild': [class_object.standingwomanholdingchild],
		'hareonhound': [class_object.hareonhound],
		'lambandstaff': [class_object.lambandstaff],
		'lionsleeping': [class_object.lionsleeping],
		'standingliturgicalapparel': [class_object.standingliturgicalapparel],
		'manfightinganimal': [class_object.manfightinganimal],
		'bowandarrow': [class_object.bowandarrow],
		'spearandpennon': [class_object.spearandpennon],
		'seatedman': [class_object.seatedman],
		}

	return (data)


# def mlmodelget():
# 	#url = os.path.join(settings.STATIC_ROOT, 'ml/2023_feb20_ml_tree')
# 	#url = os.path.join(settings.STATIC_ROOT, 'ml/ml_tree')


# 	url = os.path.join(settings.STATIC_ROOT, 'ml/ml_faceobjectset')
# 	url = os.path.join(settings.STATIC_URL, 'ml/ml_tree')

# 	print (url)
# 	print (os.listdir(settings.STATIC_URL))

# 	with open(url, 'rb') as file:	
# 		mlmodel = pickle.load(file)

# 	return(mlmodel)


def mlshowpath (mlmodel, df):
	node_indicator = mlmodel.decision_path(df)
	leaf_id = mlmodel.apply(df)
	feature = mlmodel.tree_.feature
	threshold = mlmodel.tree_.threshold
	n_nodes = mlmodel.tree_.node_count

	sample_id = 0
	# obtain ids of the nodes `sample_id` goes through, i.e., row `sample_id`
	node_index = node_indicator.indices[
	    node_indicator.indptr[sample_id] : node_indicator.indptr[sample_id + 1]
	]

	#print ("node_index", node_index)

	# feature names
	i = -1
	featurenames = []
	for col in df.columns:
	    i = i + 1
	    #print (i, col)

	    if col == "size_area":
	    	col = "size"
	    featurenames.append(col)

	decisiontreetext= []
	decisiontreedic= {}
	for node_id in node_index:
	    
	    # continue to the next node if it is a leaf node
	    if leaf_id[sample_id] == node_id:
	        continue 

	    value = df.iat[0,feature[node_id]]
	    
	    if value <= threshold[node_id]:
	        threshold_sign = "<="
	    else:
	        threshold_sign = ">"

	    decisiontreetext.append(
	        "decision node {node} : {featurename}({value}) "
	        "{inequality} {threshold}".format(
	            node=node_id,
	            sample=sample_id,
	            feature=feature[node_id],
	            featurename=featurenames[feature[node_id]],
	            value = df.iat[0,feature[node_id]],
	            #value=X2[sample_id, feature[node_id]],
	            inequality=threshold_sign,
	            threshold=threshold[node_id],
	        )
	    )

	    decisiontreedic[node_id] = {
	    	"node": node_id,
	    	"inequality": threshold_sign,
	    	"feature": feature[node_id],
	    	"featurename": featurenames[feature[node_id]],
	    	"value": df.iat[0,feature[node_id]],
	    	"inequality":threshold_sign,
	    	"threshold": round(threshold[node_id], 2)
	    }

	return (node_index, decisiontreedic)




def faceupdater(shapecode, height, width):

	print (shapecode, height, width)
	returnarea = 0

	if height == None:
		return(returnarea)

	if width == None:
		return(returnarea)

	if height > 0:
		if width > 0:
			#round
			if shapecode == 1:
				radius1 = height/2
				returnarea = math.pi * (radius1 **2)

			# Pointed Oval
			if shapecode == 2:
				radius1 = ((height * 1.06)/ 2)
				width1 = width/2
				returnarea = (((radius1**2) * (math.acos((radius1-width1) / radius1)))-((radius1-width1) * (math.sqrt((2*radius1*width1)-(width1**2))))) *2

			# Rounded Oval
			if shapecode == 3:
				returnarea = roundedoval(height, width)

			# Scutiform
			if shapecode == 4:
				returnarea = ((height/2) * width) + ((height/2) * (width/2))

			# Unknown
			if shapecode == 5:
				returnarea = roundedoval(height, width)

			# Triangle pointing up
			if shapecode == 6:
				returnarea = (height * (width/2))

			# Square
			if shapecode == 7:
				returnarea = (height * width)

			# Lozenge-shaped
			if shapecode == 8:
				returnarea = (height * width)/2

			# Quatrofoil
			if shapecode == 9:
				heightvalue = height/2
				returnarea = ((heightvalue**2) + 2 * ((math.pi * (heightvalue**2) /4)))

			# Drop-shaped
			if shapecode == 10:
				returnarea = roundedoval(height, width)

			# Undetermined
			if shapecode == 11:
				returnarea = 0

			# Triangle pointing down
			if shapecode == 12:
				returnarea = (height * (width/2))

			# Rectangular
			if shapecode == 13:
				returnarea = (height * width)

			# Hexagonal
			if shapecode == 14:
				## note that hexagons might measured from either the angle or a flat side
				## run calculation with the smallest dimension -- not the angles. https://www.math.net/area-of-a-hexagon
				testdimension = width
				if height < width:
					testdimension = height
				returnarea = (math.sqrt(3)/2) * (testdimension**2)

			# Octagonal
			if shapecode == 15:
				returnarea = 2*((height/(1+math.sqrt(2)))**2)*(1+math.sqrt(2))

			# Abnormal shape
			if shapecode == 16:
				returnarea = roundedoval(height, width)

			# Kite-shaped
			if shapecode == 17:
				returnarea = roundedoval(height, width)

	returnarea = round(returnarea,2)
	
	return(returnarea)

def roundedoval(height, width):
	radius1 = height/2
	width1 = width/2
	returnarea = math.pi * radius1 * width1	

	return(returnarea)




def mapgenerator(location_object, count_in):
	#Establishing the Map data
	longitude=""
	latitude=""
	location=""
	location_dict = ""
	additionalformat = ""

	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	placelist = []

	value1 = location_object.id_location
	value2 = location_object.location
	value3 = count_in
	value4 = location_object.longitude
	value5 = location_object.latitude

	popupcontent = '<a href="entity/' + str(value1) + '">' + str(value2) + '</a>'

	if count_in > 0:
		popupcontent = popupcontent + ' ' + str(value3)

	properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
	geometry = {"type": "Point", "coordinates": [value4, value5]}
	location = {"type": "Feature", "properties": properties, "geometry": geometry}
	placelist.append(location)

	mapdic["features"] = placelist

	return(mapdic)



def mapgenerator2(location_object):
	center_lat = []
	center_long = []

	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	placelist = []
	lat_values = []
	long_values = []

	for loc in location_object:
		value1 = loc.id_location
		value2 = loc.location
		value3 = loc.count
		value4 = loc.longitude
		value5 = loc.latitude

		if type(loc.longitude) == int or type(loc.longitude) == float:
			lat_values.append(loc.latitude)
		if type(loc.latitude) == int or type(loc.latitude) == float:
			long_values.append(loc.longitude)

		popupcontent = '<a href="entity/' + str(value1) + '">' + str(value2) + '</a>'

		if value3 > 0:
			popupcontent = popupcontent + ' ' + str(value3)

		properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
		geometry = {"type": "Point", "coordinates": [value4, value5]}
		location = {"type": "Feature", "properties": properties, "geometry": geometry}
		placelist.append(location)

	mapdic["features"] = placelist

	center_long = statistics.median(long_values)
	center_lat = statistics.median(lat_values)

	return(mapdic, center_long, center_lat)



def seriesset():
	series_object = serializers.serialize('json', Series.objects.all(), fields=('pk_series','fk_repository'))

	return (series_object)


def mapgenerator3(regiondisplayset):
	## data for region map
	# make circles data -- defaults -- note that this code is very similar to the function mapdata2
	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	regionlist = []

	count = 0

	#for circles
	for r in regiondisplayset:
		if (r['numregions'] > 0):
			value1 = r['id_regiondisplay']
			value2 = r['regiondisplay_label']
			value3 = r['numregions']
			value4 = r['regiondisplay_long']
			value5 = r['regiondisplay_lat']

			popupcontent = str(value2)
			if value3 > 0:
				popupcontent = popupcontent + ' ' + str(value3)

			properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
			geometry = {"type": "Point", "coordinates": [value4, value5]}
			location = {"type": "Feature", "properties": properties, "geometry": geometry}
			regionlist.append(location)

	mapdic["features"] = regionlist

	return(mapdic)


### generate the collection info data for chart-- 'Percentage of seals by class',
def datedistribution(qcollection):
	sealset = Seal.objects.values('date_origin')

	if (qcollection == 30000287):
		print ("whole collection")

	else:
		sealset = sealset.filter(fk_sealsealdescription__fk_collection=qcollection)

	eleventhc = 0
	twelfthc = 0
	thirteenthc = 0
	fourteenthc = 0
	fifteenthc = 0
	sixteenthc = 0
	seventeenthc = 0
	eighteenthc = 0
	nineteenthc = 0
	twentiethc = 0

	for s in sealset:
		for date_origin in s.values():
			if date_origin >= 1000 and date_origin <= 1099 : 
				eleventhc = eleventhc + 1
			elif date_origin >= 1100 and date_origin <= 1199 : 
				twelfthc = twelfthc + 1
			elif date_origin >= 1200 and date_origin <= 1299 : 
				thirteenthc = thirteenthc + 1
			elif date_origin >= 1300 and date_origin <= 1399 : 
				fourteenthc = fourteenthc + 1
			elif date_origin >= 1400 and date_origin <= 1499 : 
				fifteenthc = fifteenthc + 1
			elif date_origin >= 1500 and date_origin <= 1599 : 
				sixteenthc = sixteenthc + 1
			elif date_origin >= 1600 and date_origin <= 1699 : 
				seventeenthc = seventeenthc + 1
			elif date_origin >= 1700 and date_origin <= 1799 : 
				eighteenthc = eighteenthc + 1
			elif date_origin >= 1800 and date_origin <= 1899 : 
				nineteenthc = nineteenthc + 1
			elif date_origin >= 1900 and date_origin <= 1999 : 
				twentiethc = twentiethc + 1

		else:
			pass

	data3 = [eleventhc, twelfthc, thirteenthc, fourteenthc, fifteenthc, sixteenthc, seventeenthc, eighteenthc, nineteenthc, twentiethc]
	labels3 = ["11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th"]

	return(data3, labels3)




def collection_basemetricsqueries():


	#total number cases that have NOT been assigned to a location (yet) --- 7042 = not assigned --- location status =2 is a secondary location
	casecount = Locationname.objects.exclude(
		pk_locationname=7042).exclude(
		locationreference__fk_locationstatus=2).filter(
		locationreference__fk_event__part__fk_part__fk_support__gt=1)

	# casecount = Locationname.objects.exclude(
	# 	pk_locationname=7042).exclude(
	# 	locationreference__fk_locationstatus__isnull=True).filter(
	# 	locationreference__fk_event__part__fk_part__fk_support__fk_face__fk_seal__fk_sealsealdescription__fk_collection=qcollection).count()

	#total portion of entries with place info
	# placecount = Locationname.objects.exclude(
	# 	locationreference__fk_locationstatus=2).filter(
	# 	locationreference__fk_event__part__fk_part__fk_support__gt=1)

	place_set = sealdescription_set.exclude(fk_seal__fk_seal_face__manifestation__fk_support__fk_part__fk_event__fk_event_locationreference__fk_locationstatus__isnull=True).exclude(
			fk_seal__fk_seal_face__manifestation__fk_support__fk_part__fk_event__fk_event_locationreference__fk_locationname__fk_location=7042)

	#data for map counties
	placeset = Region.objects.filter(fk_locationtype=4, 
		location__locationname__locationreference__fk_locationstatus=1)

	#data for map regions
	regiondisplayset = Regiondisplay.objects.filter(region__location__locationname__locationreference__fk_locationstatus=1) 

	#faceset = Face.objects.filter(fk_faceterm=1)
	face_set = sealdescription_set.filter(fk_seal__fk_seal_face__fk_faceterm=1).distinct('fk_seal__fk_seal_face') 

	return(sealdescription_set, casecount, place_set, placeset, regiondisplayset, face_set)


def collectiondata(collectionid, sealcount):
	collectiondatapackage = []
	if collectionid == 30000287:
		totalsealdescriptions = Sealdescription.objects.all().count()
	else:
		totalsealdescriptions = Sealdescription.objects.filter(fk_collection=collectionid).values().distinct('sealdescription_identifier').count()

	collectiondatapackage.extend([totalsealdescriptions, sealcount])

	return(collectiondatapackage)

## a function to apply this complex filter to actor searches
def individualsearch():

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
	'fk_group__fk_group_class')

	return(individual_object)

## function to collect all the possible information you would need to present a representation
def representationmetadata(representation_case, representation_dic):

	representation_dic["representation_object"] = representation_case
	representation_dic["id_representation"] = representation_case.id_representation

	#what type of image? (Photograph, RTI....)
	representation_dic["representation_type"] = representation_case.fk_representation_type

	#where is the image stored?
	connection = representation_case.fk_connection
	representation_dic["connection_object"] = representation_case.fk_connection

	if representation_case.fk_representation_type.pk_representation_type == 2:
		print ("found RTI:", representation_case.id_representation)
		representation_dic["rti"] = connection.rti
		representation_dic["representation_folder"] = representation_case.representation_folder
		try:
			thumbnailRTI_object = get_object_or_404(Representation, fk_digisig=representation_case.fk_digisig, primacy=1)
			representation_case = thumbnailRTI_object
		except:
			print ("An exception occurred in fetching representation case for the thumbnail of the RTI", representation_dic)

	representation_dic["thumb"] = connection.thumb
	representation_dic["representation_thumbnail"] = representation_case.representation_thumbnail_hash 
	representation_dic["medium"] = connection.medium
	representation_dic["representation_filename"] = representation_case.representation_filename_hash 

	#image dimensions
	representation_dic["width"] = representation_case.width
	representation_dic["height"] = representation_case.height

	#who made it?
	creator_object = representation_case.fk_contributor_creator
	representation_dic["contributorcreator_object"] = creator_object
	try:
		creator_phrase = creator_object.name_first + " " + creator_object.name_middle + " " + creator_object.name_last
	except:
		try:
			creator_phrase = creator_object.name_first + " " + creator_object.name_last
		except:
			try:
				creator_phrase = creator_object.name_last
			except:
				creator_phrase = "N/A"
	representation_dic["contributorcreator_name"] = creator_phrase.strip()

	#when was it made?
	representation_dic["datecreated"] = representation_case.representation_datecreated

	#where does it come from?
	representation_dic["collection_object"] = representation_case.fk_collection

	#what rights?
	representation_dic["rights_object"] = representation_case.fk_rightsholder

	#what other representations are there of the targetobject?
	representation_objectset = Representation.objects.filter(fk_digisig=representation_case.fk_digisig).exclude(id_representation=representation_case.id_representation)
	representation_dic["representation_objectset"] = representation_objectset
	representation_dic["totalrows"] = representation_objectset.count

	return (representation_dic)


def representationmetadata_manifestation(representation_case, representation_dic):

	manifestation = representation_case.fk_manifestation
	representation_dic["manifestation_object"] = manifestation

	support = manifestation.fk_support
	representation_dic["support_object"] = support

	part = support.fk_part
	item = part.fk_item
	representation_dic["item"] = item
	event = part.fk_event
	representation_dic["event"] = event

	face = manifestation.fk_face
	seal = face.fk_seal
	representation_dic["seal"] = seal

	individual_object = seal.fk_individual_realizer
	representation_dic["outname"] = namecompiler(individual_object)
	representation_dic["individual_object"] = individual_object

	sealdescription_objectset = Sealdescription.objects.select_related('fk_collection').filter(fk_seal = seal.id_seal)
	representation_dic["sealdescription_objectset"] = sealdescription_objectset

	return(representation_dic)

def representationmetadata_part(representation_case, representation_dic):

	try:
		part = get_object_or_404(Part, id_part=representation_case.fk_digisig)

	except:
		print ("An exception occurred in the part record")

	try:			
		item = part.fk_item
		representation_dic["item"] = item
		representation_dic["event"] = part.fk_event
		representation_dic["main_title"] = str(item.fk_repository) + " " + str (item.shelfmark)
		representation_dic["repository"] = str(item.fk_repository)
		representation_dic["shelfmark"] = str (item.shelfmark)

	except:
		print ("An exception occurred in item and event")

	try:
		region_objectset = Region.objects.filter( 
			location__locationname__locationreference__fk_locationstatus=1, 
			location__locationname__locationreference__fk_event=part.fk_event)
		representation_dic["region_objectset"] = region_objectset
	except:
		print ("An exception occurred in region information")

	return(representation_dic)

def representationmetadata_sealdescription(representation_case, representation_dic):

	#Seal Description
	if representation_dic["entity_type"] == 3:
		representation_dic["main_title"] = "Seal Description"

	return(representation_dic)

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

def defaultpagination(pagination_object, qpagination):

	pagination_object = Paginator(pagination_object, 10).page(qpagination)
	totalrows = pagination_object.paginator.count
	totaldisplay = str(pagination_object.start_index()) + "-" + str(pagination_object.end_index())

	return(pagination_object, totalrows, totaldisplay, qpagination)

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


#assembles the list of people credited with a work
def sealdescription_contributorgenerate(collection, contributor_dic):

	collectioncontributions = Collectioncontributor.objects.filter(
		fk_collection=collection).select_related(
		'fk_contributor').select_related(
		'fk_collectioncontribution')

	contribution_set = {}

	for c in collectioncontributions:
		contribution = {}
		contribution['contribution'] = c.fk_collectioncontribution.collectioncontribution 
		
		namevalue = ""
		if c.fk_contributor.name_first:
			namevalue = namevalue + c.fk_contributor.name_first
		if c.fk_contributor.name_first:
			namevalue = namevalue + " " + c.fk_contributor.name_middle
		if c.fk_contributor.name_first:
			namevalue = namevalue + " " + c.fk_contributor.name_last

		contribution['name'] = namevalue
		contribution['uricontributor'] = c.fk_contributor.uricontributor
		
		contribution_set[c.fk_contributor] = contribution

	contributor_dic["contributors"] = contribution_set

	return(contributor_dic)


def	sealdescription_fetchrepresentation(sealdescription_object, sealdescription_dic):

	try:
		representation_set = Representation.objects.select_related(
			'fk_connection').get(
			fk_digisig=sealdescription_object.id_sealdescription, primacy=1)

	except:
		print ("no image available for:", sealdescription_object)
		representation_set = Representation.objects.select_related('fk_connection').get(id_representation=12204474)

	sealdescription_dic["thumb"] = representation_set.fk_connection.thumb
	sealdescription_dic["medium"] = representation_set.fk_connection.medium
	sealdescription_dic["representation_thumbnail_hash"] = representation_set.representation_thumbnail_hash
	sealdescription_dic["representation_filename_hash"] = representation_set.representation_filename_hash 
	sealdescription_dic["id_representation"] = representation_set.id_representation

	return(sealdescription_dic)


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
	try:
		if (individual_object.fk_group != None): namevariable = individual_object.fk_group.group_name
		if (individual_object.fk_descriptor_title != None): namevariable = namevariable + " " + individual_object.fk_descriptor_title.descriptor_modern
		if (individual_object.fk_descriptor_name != None): namevariable = namevariable + " " + individual_object.fk_descriptor_name.descriptor_modern
		if (individual_object.fk_descriptor_prefix1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix1.prefix_english
		if (individual_object.fk_descriptor_descriptor1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor1.descriptor_modern
		if (individual_object.fk_descriptor_prefix2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix2.prefix_english
		if (individual_object.fk_descriptor_descriptor2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor2.descriptor_modern
		if (individual_object.fk_descriptor_prefix3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix3.prefix_english
		if (individual_object.fk_descriptor_descriptor3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor3.descriptor_modern

	except:
		print ("problem with name")

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


#externallinks for object
def externallinkgenerator(digisig_entity_number):
	externallinkset = []
	externallinkset = Externallink.objects.filter(internal_entity=digisig_entity_number)

	return (externallinkset)	


#info for collections page
def classdistribution(classset, facecount):

	data2 = []
	labels2 = []
	resultdic = {}

	allclasses = Classification.objects.all()

	for case in allclasses:
		casecount = 0
		if (case.level == 4):
			limitset = classset.filter(level4=case.class_number)
			for l in limitset: 
				casecount = casecount + l.numcases
		if (case.level == 3):
			limitset = classset.filter(level3=case.class_number)
			for l in limitset:
				casecount = casecount + l.numcases
				#print ("++", l.class_name, l.level, l.numcases, case.numcases)
		if (case.level == 2):
			limitset = classset.filter(level2=case.class_number)
			for l in limitset:
				casecount = casecount + l.numcases
				#print ("++", l.class_name, l.level, l.numcases, case.numcases)
		if (case.level == 1):
			limitset = classset.filter(level1=case.class_number)
			for l in limitset:
				casecount = casecount + l.numcases
				# print ("++", l.class_name, l.level, l.numcases, case.numcases)

		percentagedata = (casecount/facecount)*100
		if percentagedata > 1:
			resultdic.update({case.class_name: percentagedata})

	allclasses = allclasses.order_by('class_sortorder')
	for case in allclasses:
		if case.class_name in resultdic:
			classpercentage = resultdic.get(case.class_name)
			if classpercentage > 1:
				data2.append(classpercentage)
				labels2.append(case.class_name)

	return(data2, labels2)