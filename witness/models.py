# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.

from django.db import models
from django.forms import ModelForm
from django.utils.safestring import mark_safe
from django.contrib.auth.models import User

from .models import *

#### project seems to reference the version of this file in digisig -- 2024 nov


### specials
class Digisigrelationshipview(models.Model):
    pk_branch = models.AutoField(primary_key=True)
    fk_individual = models.IntegerField(blank=True, null=True)
    fk_relationshiprole = models.IntegerField(blank=True, null=True)
    person2 = models.IntegerField(blank=True, null=True)
    fk_relationshipnode = models.IntegerField(blank=True, null=True)
    date_start = models.DateField(blank=True, null=True)
    date_end = models.DateField(blank=True, null=True)
    relationship_role = models.IntegerField(blank=True, null=True)
    group_name = models.TextField(blank=True, null=True)
    groupclass = models.TextField(blank=True, null=True)
    grouporder = models.TextField(blank=True, null=True)
    descriptor_title = models.TextField(blank=True, null=True)
    descriptor_name = models.TextField(blank=True, null=True)
    descriptor1 = models.TextField(blank=True, null=True)
    descriptor2 = models.TextField(blank=True, null=True)
    descriptor3 = models.TextField(blank=True, null=True)
    prefix1 = models.TextField(blank=True, null=True)
    prefix2 = models.TextField(blank=True, null=True)
    prefix3 = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'digisig_relationship_view'

#### Digisig
class Digisigreferenceview(models.Model):
    fk_event  = models.IntegerField(blank=True, null=True)
    startdate = models.DateField(blank=True, null=True)
    enddate = models.DateField(blank=True, null=True)
    repository_startdate = models.DateField(blank=True, null=True)
    repository_enddate = models.DateField(blank=True, null=True)
    fk_region  = models.IntegerField(blank=True, null=True)
    pk_location  = models.IntegerField(blank=True, null=True)
    id_location  = models.IntegerField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    pk_referenceindividual = models.AutoField(primary_key=True)
    fk_individual  = models.IntegerField(blank=True, null=True)
    fk_referencerole  = models.IntegerField(blank=True, null=True)
    referencerole = models.TextField(blank=True, null=True)
    id_part  = models.IntegerField(blank=True, null=True)
    fk_item  = models.IntegerField(blank=True, null=True)
    shelfmark = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = '2024_references'


### normal tables

class Access(models.Model):
    pk_access = models.IntegerField(primary_key=True)
    access_level = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.access_level or ''

    class Meta:
        managed = False
        db_table = 'access'


class Approximation(models.Model):
    pk_approximation = models.AutoField(primary_key=True)
    approximation_temporal = models.TextField(blank=True, null=True)
    approximation_physical = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.approximation_temporal or ''

    class Meta:
        managed = False
        db_table = 'approximation'


class Attachment(models.Model):
    pk_attachment = models.AutoField(primary_key=True)
    attachment = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.attachment or ''

    class Meta:
        managed = False
        db_table = 'attachment'

class Catalogue(models.Model):
    pk_catalogue = models.AutoField(primary_key=True)
    title = models.TextField(blank=True, null=True)
    fk_access = models.IntegerField(blank=True, null=True)
    publicationdate_start = models.IntegerField(blank=True, null=True)
    publicationdate_end = models.IntegerField(blank=True, null=True)
    uri_catalogue = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'catalogue'


class Certainty(models.Model):
    pk_certainty = models.AutoField(primary_key=True)
    certainty = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'certainty'


class Changes(models.Model):
    pk_change = models.AutoField(primary_key=True)
    change = models.TextField(blank=True, null=True)
    change_date = models.DateField()

    class Meta:
        managed = False
        db_table = 'changes'
        verbose_name_plural = 'Changes'


class Classification(models.Model):
    class_number = models.IntegerField()
    class_name = models.TextField(blank=True, null=True)
    classnotation = models.TextField(blank=True, null=True)
    classdefinition = models.TextField(blank=True, null=True)
    classtitle = models.TextField(blank=True, null=True)
    level = models.IntegerField(blank=True, null=True)
    level1 = models.IntegerField(blank=True, null=True)
    level2 = models.IntegerField(blank=True, null=True)
    level3 = models.IntegerField(blank=True, null=True)
    level4 = models.IntegerField(blank=True, null=True)
    level5 = models.IntegerField(blank=True, null=True)
    level6 = models.IntegerField(blank=True, null=True)
    level7 = models.IntegerField(blank=True, null=True)
    level8 = models.IntegerField(blank=True, null=True)
    level9 = models.IntegerField(blank=True, null=True)
    level10 = models.IntegerField(blank=True, null=True)
    fk_seal_example = models.IntegerField(blank=True, null=True)
    printphrase_class = models.TextField(blank=True, null=True)
    printindex = models.TextField(blank=True, null=True)
    class_sortorder = models.IntegerField(blank=True, null=True)
    datasetwales = models.BooleanField(blank=True, null=True)
    datasetlondon = models.BooleanField(blank=True, null=True)
    stub = models.TextField(blank=True, null=True)
    fk_face_example = models.IntegerField(blank=True, null=True)
    fk_representation_example = models.IntegerField(blank=True, null=True)
    cases = models.IntegerField(blank=True, null=True)
    id_class = models.AutoField(primary_key=True)
    animal = models.IntegerField(blank=True, null=True)
    human = models.IntegerField(blank=True, null=True)
    object_class = models.IntegerField(blank=True, null=True, db_column='objects')
    device = models.IntegerField(blank=True, null=True)
    undetermined = models.IntegerField(blank=True, null=True)
    unassigned = models.IntegerField(blank=True, null=True)
    beast = models.IntegerField(blank=True, null=True)
    bird = models.IntegerField(blank=True, null=True)
    fish = models.IntegerField(blank=True, null=True)
    insect = models.IntegerField(blank=True, null=True)
    bust = models.IntegerField(blank=True, null=True)
    hand = models.IntegerField(blank=True, null=True)
    boat = models.IntegerField(blank=True, null=True)
    building = models.IntegerField(blank=True, null=True)
    container = models.IntegerField(blank=True, null=True)
    equipment = models.IntegerField(blank=True, null=True)
    naturalproduct = models.IntegerField(blank=True, null=True)
    irregular = models.IntegerField(blank=True, null=True)
    radial = models.IntegerField(blank=True, null=True)
    lattice = models.IntegerField(blank=True, null=True)
    fulllength = models.IntegerField(blank=True, null=True)
    symbol = models.IntegerField(blank=True, null=True)
    hawkhunting = models.IntegerField(blank=True, null=True)
    pelicaninpiety = models.IntegerField(blank=True, null=True)
    headondish = models.IntegerField(blank=True, null=True)
    twoheads = models.IntegerField(blank=True, null=True)
    crossedhands = models.IntegerField(blank=True, null=True)
    handholdingitem = models.IntegerField(blank=True, null=True)
    seated = models.IntegerField(blank=True, null=True)
    standing = models.IntegerField(blank=True, null=True)
    riding = models.IntegerField(blank=True, null=True)
    crucified = models.IntegerField(blank=True, null=True)
    apparel = models.IntegerField(blank=True, null=True)
    crenellation = models.IntegerField(blank=True, null=True)
    tool = models.IntegerField(blank=True, null=True)
    weapon = models.IntegerField(blank=True, null=True)
    shell = models.IntegerField(blank=True, null=True)
    wheatsheaf = models.IntegerField(blank=True, null=True)
    stylizedlily = models.IntegerField(blank=True, null=True)
    crosses = models.IntegerField(blank=True, null=True)
    heart = models.IntegerField(blank=True, null=True)
    merchantmark = models.IntegerField(blank=True, null=True)
    texts = models.IntegerField(blank=True, null=True)
    handholdingbird = models.IntegerField(blank=True, null=True)
    halflength = models.IntegerField(blank=True, null=True)
    crescent = models.IntegerField(blank=True, null=True)
    beastbody = models.IntegerField(blank=True, null=True)
    beasthead = models.IntegerField(blank=True, null=True)
    doubleheadedeagle = models.IntegerField(blank=True, null=True)
    horseshoe = models.IntegerField(blank=True, null=True)
    twobirdsdrinking = models.IntegerField(blank=True, null=True)
    animalequipment = models.IntegerField(blank=True, null=True)
    transport = models.IntegerField(blank=True, null=True)
    halflengthwomanholdingchild = models.IntegerField(blank=True, null=True)
    halflengthwoman = models.IntegerField(blank=True, null=True)
    halflengthman = models.IntegerField(blank=True, null=True)
    swine = models.IntegerField(blank=True, null=True)
    boarhead = models.IntegerField(blank=True, null=True)
    centaur = models.IntegerField(blank=True, null=True)
    dragon = models.IntegerField(blank=True, null=True)
    hare = models.IntegerField(blank=True, null=True)
    lion = models.IntegerField(blank=True, null=True)
    lionhead = models.IntegerField(blank=True, null=True)
    mermaid = models.IntegerField(blank=True, null=True)
    squirrel = models.IntegerField(blank=True, null=True)
    stag = models.IntegerField(blank=True, null=True)
    staghead = models.IntegerField(blank=True, null=True)
    unicorn = models.IntegerField(blank=True, null=True)
    unicornhead = models.IntegerField(blank=True, null=True)
    wolf = models.IntegerField(blank=True, null=True)
    wolfhead = models.IntegerField(blank=True, null=True)
    standingwoman = models.IntegerField(blank=True, null=True)
    standingman = models.IntegerField(blank=True, null=True)
    armouredmanequestrian = models.IntegerField(blank=True, null=True)
    seatedwomanholdingchild = models.IntegerField(blank=True, null=True)
    axe = models.IntegerField(blank=True, null=True)
    shears = models.IntegerField(blank=True, null=True)
    arrow = models.IntegerField(blank=True, null=True)
    spear = models.IntegerField(blank=True, null=True)
    sword = models.IntegerField(blank=True, null=True)
    banner = models.IntegerField(blank=True, null=True)
    shield = models.IntegerField(blank=True, null=True)
    christogram = models.IntegerField(blank=True, null=True)
    lionfighting = models.IntegerField(blank=True, null=True)
    sheep = models.IntegerField(blank=True, null=True)
    griffin = models.IntegerField(blank=True, null=True)
    hammer = models.IntegerField(blank=True, null=True)
    standingwomanholdingchild = models.IntegerField(blank=True, null=True)
    hareonhound = models.IntegerField(blank=True, null=True)
    lambandstaff = models.IntegerField(blank=True, null=True)
    lionsleeping = models.IntegerField(blank=True, null=True)
    standingliturgicalapparel = models.IntegerField(blank=True, null=True)
    manfightinganimal = models.IntegerField(blank=True, null=True)
    bowandarrow = models.IntegerField(blank=True, null=True)
    spearandpennon = models.IntegerField(blank=True, null=True)
    seatedman = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.class_name or ''

    class Meta:
        managed = False
        db_table = 'class'

class Classificationparentchild(models.Model):
    id_classificationparentchild = models.AutoField(primary_key=True)
    fk_term = models.ForeignKey('Terminology', models.DO_NOTHING, db_column='fk_term', related_name='fk_term_interchange', blank=True, null=True)
    class_numberparent = models.IntegerField(blank=True, null=True)
    fk_class = models.ForeignKey('Classification', models.DO_NOTHING, db_column='fk_class', related_name='fk_class_interchange',blank=True, null=True)
    class_numberchild = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'classification_parentchild'



class Collection(models.Model):
    pk_collection = models.IntegerField(blank=True, null=True)
    collection_shorttitle = models.TextField(blank=True, null=True)
    collection_fulltitle = models.TextField(blank=True, null=True)
    collection_pagereference = models.TextField(blank=True, null=True)
    fk_unit = models.IntegerField(blank=True, null=True)
    fk_catalogue = models.IntegerField(blank=True, null=True)
    collection_volume = models.TextField(blank=True, null=True)
    fk_contributor = models.IntegerField(blank=True, null=True)
    collection_thumbnail = models.TextField(blank=True, null=True)
    collection_author = models.TextField(blank=True, null=True)
    collection_publicationdata = models.TextField(blank=True, null=True)
    collection_title = models.TextField(blank=True, null=True)
    fk_access = models.IntegerField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    collection_url = models.TextField(blank=True, null=True)
    collection_fulltitle2 = models.TextField(blank=True, null=True)
    id_collection = models.AutoField(primary_key=True)

    def __str__(self): 
        return self.collection_shorttitle or ''

    class Meta:
        managed = False
        db_table = 'collection'

class Collectioncontribution(models.Model):
    id_collectioncontribution = models.AutoField(primary_key=True)
    collectioncontribution = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.collectioncontribution or ''

    class Meta:
        managed = False
        db_table = 'collectioncontribution'


class Collectioncontributor(models.Model):
    id_collectioncontributor = models.AutoField(primary_key=True)
    fk_contributor = models.ForeignKey('Contributor', models.DO_NOTHING, related_name="fk_contributor_contributor", db_column='fk_contributor', blank=True, null=True)
    fk_collection = models.ForeignKey('Collection', models.DO_NOTHING, related_name="fk_collection_contributor", db_column='fk_collection', blank=True, null=True)
    fk_collectioncontribution = models.ForeignKey('Collectioncontribution', models.DO_NOTHING, related_name="fk_collectioncontribution", db_column='fk_collectioncontribution', blank=True, null=True) 

    #Nb: adding a return self here seems to create problems in django admin with inline object saving in collection edit form (2022.apr)
 
    class Meta:
        managed = False
        db_table = 'collectioncontributor'


class Colour(models.Model):
    pk_colour = models.AutoField(primary_key=True)
    colour = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'colour'


class Connection(models.Model):
    pk_connection = models.AutoField(primary_key=True)
    connection = models.TextField(blank=True, null=True)
    fk_repository = models.IntegerField(blank=True, null=True)
    thumb = models.TextField(blank=True, null=True)
    medium = models.TextField(blank=True, null=True)
    connection_description = models.TextField(blank=True, null=True)
    connection_sealdescriptions = models.TextField(blank=True, null=True)
    rti = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.thumb or ''

    class Meta:
        managed = False
        db_table = 'connection'


class Contributor(models.Model):
    pk_contributor = models.AutoField(primary_key=True)
    name_first = models.TextField(blank=True, null=True)
    name_last = models.TextField(blank=True, null=True)
    name_middle = models.TextField(blank=True, null=True)
    email = models.TextField(blank=True, null=True)
    uricontributor = models.TextField(db_column='uricontributor', blank=True, null=True)  # Field name made lowercase.

    def __str__(self):
        namestring = ""        
        if self.name_first is not None:
            namestring = self.name_first 
        if self.name_middle is not None:
            namestring = namestring + " " + self.name_middle
        if self.name_last is not None:
            namestring = namestring + " " + self.name_last 
        return namestring or ''

    class Meta:
        managed = False
        db_table = 'contributor'


class Dataset(models.Model):
    id_dataset = models.AutoField(primary_key=True)
    dataset = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dataset'

class Descriptor(models.Model):
    pk_descriptor = models.AutoField(primary_key=True)
    descriptor_modern = models.TextField(blank=True, null=True)
    descriptor_original = models.TextField(blank=True, null=True)
    descriptor_comment = models.TextField(blank=True, null=True)
    fk_gender = models.IntegerField(blank=True, null=True)
    fk_descriptortype = models.IntegerField(blank=True, null=True)
    fk_language = models.IntegerField(blank=True, null=True)
    indexphrase = models.TextField(blank=True, null=True)
    indexentry = models.TextField(blank=True, null=True)
    exclude = models.BooleanField(blank=True, null=True)
    includeoriginal = models.BooleanField(blank=True, null=True)
    fk_descriptor = models.IntegerField(blank=True, null=True)
    crossreferencephrase = models.TextField(blank=True, null=True)
    indexentry_format = models.TextField(blank=True, null=True)
    missingmainentry = models.BooleanField(blank=True, null=True)
    article = models.BooleanField(blank=True, null=True)
    comma = models.BooleanField(blank=True, null=True)

    def __str__(self): 
        return self.descriptor_original or ''

    class Meta:
        managed = False
        db_table = 'descriptor'


class Descriptortype(models.Model):
    pk_descriptortype = models.IntegerField(blank=True, null=True)
    descriptortype = models.CharField(max_length=255, blank=True, null=True)
    descriptortype_definition = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'descriptortype'


class Entity(models.Model):
    pk_entity = models.AutoField(primary_key=True)
    entity_view = models.TextField(blank=True, null=True)
    entity_returnedvariables = models.TextField(blank=True, null=True)
    entity_column = models.TextField(blank=True, null=True)
    entity_code = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'entity'


class Event(models.Model):
    part_description = models.TextField(blank=True, null=True)
    part_transcription = models.TextField(blank=True, null=True)
    fk_dateapprox_event_start = models.ForeignKey('Approximation', models.DO_NOTHING, related_name="fk_dateapprox_event_start", db_column='fk_dateapprox_event_start', blank=True, null=True)
    event_daystart = models.SmallIntegerField(blank=True, null=True)
    fk_month_event_start = models.ForeignKey('Month', models.DO_NOTHING, related_name="fk_month_event_start", db_column='fk_month_event_start', blank=True, null=True)
    event_yearstart = models.SmallIntegerField(blank=True, null=True)
    event_comment_start = models.TextField(blank=True, null=True)
    fk_dateapprox_event_end = models.ForeignKey('Approximation', models.DO_NOTHING, related_name="fk_dateapprox_event_end", db_column='fk_dateapprox_event_end', blank=True, null=True)
    event_dayend = models.SmallIntegerField(blank=True, null=True)
    fk_month_event_end = models.ForeignKey('Month', models.DO_NOTHING, related_name="fk_month_event_end", db_column='fk_month_event_end', blank=True, null=True)
    event_yearend = models.SmallIntegerField(blank=True, null=True)
    event_comment_end = models.TextField(blank=True, null=True)
    fk_period_event = models.SmallIntegerField(blank=True, null=True)
    event_comment = models.TextField(blank=True, null=True)
    #fk_locationname = models.ForeignKey('Locationname', models.DO_NOTHING, related_name="fk_locationname", db_column='fk_locationname', blank=True, null=True)
    event_comment_location = models.TextField(blank=True, null=True)
    repository_startdate = models.DateField(blank=True, null=True)
    repository_enddate = models.DateField(blank=True, null=True)
    repository_location = models.TextField(blank=True, null=True)
    repository_description = models.TextField(blank=True, null=True)
    startdate = models.DateField(blank=True, null=True)
    enddate = models.DateField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    pk_event = models.AutoField(primary_key=True)
    pas_id = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    fk_locationreference = models.ForeignKey('Locationreference', models.DO_NOTHING, related_name="fk_locationreference", db_column='fk_locationreference', blank=True, null=True)
    schoyen = models.SmallIntegerField(blank=True, null=True)
    temp_ranger = models.SmallIntegerField(blank=True, null=True)
    fk_dateapprox_repository_start = models.ForeignKey('Approximation', models.DO_NOTHING, related_name="fk_dateapprox_repository_start", db_column='fk_dateapprox_repository_start', blank=True, null=True)
    fk_dateapprox_repository_start = models.ForeignKey('Approximation', models.DO_NOTHING, related_name="fk_dateapprox_repository_end", db_column='fk_dateapprox_repository_end', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'event'


class EventLocation(models.Model):
    pk_event_location = models.AutoField(primary_key=True)
    event_location = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'event_location'


class Externallink(models.Model):
    id_external_link = models.AutoField(primary_key=True)
    internal_entity = models.IntegerField(blank=True, null=True)
    link_predicate = models.TextField(blank=True, null=True)
    external_link = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'externallink'


class Face(models.Model):
    pk_face = models.IntegerField()
    fk_seal = models.ForeignKey('Seal', models.DO_NOTHING, db_column='fk_seal', related_name='fk_seal_face', blank=True, null=True)
    fk_faceterm = models.ForeignKey('Faceterm', models.DO_NOTHING, db_column='fk_faceterm', blank=True, null=True)
    fk_shape = models.ForeignKey('Shape', models.DO_NOTHING, db_column='fk_shape', blank=True, null=True)
    fk_approx_vertical = models.IntegerField(blank=True, null=True)
    face_vertical = models.IntegerField(blank=True, null=True)
    fk_approx_horizontal = models.IntegerField(blank=True, null=True)
    face_horizontal = models.IntegerField(blank=True, null=True)
    legend = models.TextField(blank=True, null=True)
    design = models.TextField(blank=True, null=True)
    face_comment = models.TextField(blank=True, null=True)
    fk_legend_specific = models.IntegerField(blank=True, null=True)
    print_sealmanifestation = models.TextField(blank=True, null=True)
    print_sealsizeandshape = models.TextField(blank=True, null=True)
    #fk_class = models.ForeignKey('Classification_parent', models.DO_NOTHING, db_column='fk_classchild', blank=True, null=True)
    fk_class = models.ForeignKey('Classification', models.DO_NOTHING, db_column='fk_class', related_name='fk_class_face',blank=True, null=True)
    datasetparticipation = models.IntegerField(blank=True, null=True)
    dataset_durham = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    id_face = models.AutoField(primary_key=True)
    temp_bm = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    size_area = models.DecimalField(max_digits=65535, decimal_places=3, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'face'


class Faceterm(models.Model):
    pk_faceterm = models.AutoField(primary_key=True)
    faceterm = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.faceterm or ''

    class Meta:
        managed = False
        db_table = 'faceterm'


class Field(models.Model):
    pk_field = models.AutoField(primary_key=True)
    field_title = models.TextField(blank=True, null=True)
    field_order = models.IntegerField(blank=True, null=True)
    field_column = models.TextField(blank=True, null=True)
    field_returnedvariables = models.TextField(blank=True, null=True)
    field_url = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'field'


class Fraction(models.Model):
    pk_fraction = models.AutoField(primary_key=True)
    fraction = models.TextField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fraction'


class Gender(models.Model):
    pk_gender = models.AutoField(primary_key=True)
    gender = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'gender'


class Groupclass(models.Model):
    id_groupclass = models.AutoField(primary_key=True)
    groupclass = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.groupclass or ''

    class Meta:
        managed = False
        db_table = 'group_class'


class Groupname(models.Model):
    id_group = models.AutoField(primary_key=True)
    group_name = models.TextField(blank=True, null=True)
    fk_group_class = models.ForeignKey('Groupclass', models.DO_NOTHING, related_name="fk_group_class", db_column='fk_group_class', blank=True, null=True)
    fk_group_order = models.ForeignKey('Grouporder', models.DO_NOTHING, related_name="fk_group_order", db_column='fk_group_order', blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.group_name or ''

    class Meta:
        managed = False
        db_table = 'group_name'


class Grouporder(models.Model):
    id_grouporder = models.AutoField(primary_key=True)
    grouporder = models.TextField(blank=True, null=True)
    fk_group_class = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.grouporder or ''

    class Meta:
        managed = False
        db_table = 'group_order'


class ImageState(models.Model):
    pk_imagestate = models.AutoField(primary_key=True)
    imagestate = models.TextField(blank=True, null=True)
    imagestate_term = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.imagestate_term or ''

    class Meta:
        managed = False
        db_table = 'image_state'


class Individual(models.Model):
    pk_individual = models.IntegerField(blank=True, null=True)
    corporateentity = models.BooleanField(blank=False, null=False)
    fk_descriptor_title = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_title", db_column='fk_descriptor_title', blank=True, null=True)
    fk_descriptor_name = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_name", db_column='fk_descriptor_name', blank=True, null=True)
    fk_separator_name = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_name", db_column='fk_separator_name', blank=True, null=True)
    fk_descriptor_prefix1 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix1", db_column='fk_descriptor_prefix1', blank=True, null=True)
    fk_descriptor_descriptor1 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_descriptor1", db_column='fk_descriptor_descriptor1', blank=True, null=True)
    fk_separator_1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_1", db_column='fk_separator_1', blank=True, null=True)
    fk_descriptor_prefix2 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix2", db_column='fk_descriptor_prefix2', blank=True, null=True)
    fk_descriptor_descriptor2 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_descriptor2", db_column='fk_descriptor_descriptor2', blank=True, null=True)
    fk_descriptor_prefix3 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix3", db_column='fk_descriptor_prefix3', blank=True, null=True)
    fk_separator_2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_2", db_column='fk_separator_2', blank=True, null=True)
    fk_descriptor_descriptor3 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_descriptor3", db_column='fk_descriptor_descriptor3', blank=True, null=True)
    fullname_original = models.TextField(blank=True, null=True)
    fullname_modern = models.TextField(blank=True, null=True)
    alias = models.TextField(blank=True, null=True)
    datestart = models.TextField(blank=True, null=True)
    fk_event_start = models.IntegerField(blank=True, null=True)
    comment_individual_start = models.TextField(blank=True, null=True)
    datestop = models.TextField(blank=True, null=True)
    fk_event_stop = models.TextField(blank=True, null=True)
    comment_individual_stop = models.TextField(blank=True, null=True)
    seal = models.BooleanField(blank=True, null=True)
    civicoffice = models.BooleanField(blank=True, null=True)
    mayor = models.BooleanField(blank=True, null=True)
    comment_mayor = models.TextField(blank=True, null=True)
    sheriff = models.BooleanField(blank=True, null=True)
    comment_sheriff = models.TextField(blank=True, null=True)
    alderman = models.BooleanField(blank=True, null=True)
    fk_event_startalderman = models.IntegerField(blank=True, null=True)
    aldermanstart = models.IntegerField(blank=True, null=True)
    fk_event_endalderman = models.IntegerField(blank=True, null=True)
    aldermanend = models.IntegerField(blank=True, null=True)
    comment_alderman = models.TextField(blank=True, null=True)
    office = models.BooleanField(blank=True, null=True)
    comment_office = models.TextField(blank=True, null=True)
    sussexdataset = models.BooleanField(blank=True, null=True)
    walesid = models.IntegerField(blank=True, null=True)
    dl25id = models.IntegerField(blank=True, null=True)
    fk_occupation = models.IntegerField(blank=True, null=True)
    fk_mld_id = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    id_individual = models.AutoField(primary_key=True)
    fk_group = models.ForeignKey('Groupname', models.DO_NOTHING, related_name="fk_group", db_column='fk_group', blank=True, null=True)

    def __str__(self): 
        return self.fullname_original or ''

    class Meta:
        managed = False
        db_table = 'individual'


class Item(models.Model):
    pk_item = models.IntegerField()
    fk_repository = models.ForeignKey('Repository', models.DO_NOTHING, related_name="fk_repository", db_column='fk_repository', blank=True, null=True)
    fk_series = models.ForeignKey('Series', models.DO_NOTHING, db_column='fk_series')
    classmark_alpha1 = models.TextField(blank=True, null=True)
    classmark_number1 = models.IntegerField(blank=True, null=True)
    classmark_alpha2 = models.TextField(blank=True, null=True)
    classmark_number2 = models.IntegerField(blank=True, null=True)
    classmark_alpha3 = models.TextField(blank=True, null=True)
    classmark_number3 = models.IntegerField(blank=True, null=True)
    catalogue = models.TextField(blank=True, null=True)
    fk_dateapprox_start = models.IntegerField(blank=True, null=True)
    year_start = models.SmallIntegerField(blank=True, null=True)
    fk_month_start = models.IntegerField(blank=True, null=True)
    day_start = models.SmallIntegerField(blank=True, null=True)
    fk_dateapprox_end = models.IntegerField(blank=True, null=True)
    year_end = models.SmallIntegerField(blank=True, null=True)
    fk_month_end = models.IntegerField(blank=True, null=True)
    day_end = models.SmallIntegerField(blank=True, null=True)
    comment_datestart = models.TextField(blank=True, null=True)
    comment_dateend = models.TextField(blank=True, null=True)
    fk_period = models.IntegerField(blank=True, null=True)
    feature_seal = models.BooleanField(blank=True, null=True)
    feature_support = models.SmallIntegerField(blank=True, null=True)
    photograph = models.BooleanField(blank=True, null=True)
    feature_chirograph = models.BooleanField(blank=True, null=True)
    feature_sealed = models.BooleanField(blank=True, null=True)
    feature_indented = models.BooleanField(blank=True, null=True)
    comment_item = models.TextField(blank=True, null=True)
    item_timestamp = models.DateTimeField(blank=True, null=True)
    #NOTE : id_repository is the REPOSITORY's own id number -- not a digisig id
    id_repository = models.TextField(blank=True, null=True)
    shelfmark = models.TextField(blank=True, null=True)
    id_item = models.BigAutoField(primary_key=True)
    ui_item_repository = models.TextField(blank=True, null=True)
    prefix_alpha1 = models.TextField(blank=True, null=True)
    prefix_number1 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    prefix_alpha2 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    prefix_number2 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    prefix_alpha3 = models.TextField(blank=True, null=True)
    temp_durham = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    prefix_number3 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'item'


class Jsonstorage(models.Model):
    id_jsonfile = models.AutoField(primary_key=True)
    jsonfiletxt = models.TextField(blank=True, null=True)
    # jsonfile = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'jsonstorage'


class Language(models.Model):
    pk_language = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'language'


class Legendspecific(models.Model):
    pk_legendspecific = models.AutoField(primary_key=True)
    fk_legendtype = models.ForeignKey('Legendtype', models.DO_NOTHING, db_column='fk_legendtype', blank=True, null=True)
    legendspecific = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'legendspecific'

class Legendtype(models.Model):
    pk_legendtype = models.AutoField(primary_key=True)
    legendtype = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'legendtype'


class Location(models.Model):
    id_location = models.AutoField(primary_key=True)
    pk_location = models.IntegerField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    xcoordinate = models.IntegerField(blank=True, null=True)
    ycoordinate = models.IntegerField(blank=True, null=True)
    fk_locationtype = models.IntegerField(blank=True, null=True)
    fk_gazetteer = models.IntegerField(blank=True, null=True)
    fk_englandwales_parish = models.IntegerField(blank=True, null=True)
    mld_locationname = models.TextField(blank=True, null=True)
    fk_gb_1900 = models.IntegerField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    long_lat_source = models.TextField(blank=True, null=True)
    fk_region = models.ForeignKey('Region', models.DO_NOTHING, db_column='fk_region', blank=True, null=True)
    fk_geonames = models.IntegerField(blank=True, null=True)  
    fk_os = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.location or ''

    class Meta:
        managed = False
        db_table = 'location'


class Locationname(models.Model):
    pk_locationname = models.AutoField(primary_key=True)
    locationname = models.TextField(blank=True, null=True)
    fk_location = models.ForeignKey('Location', models.DO_NOTHING, db_column='fk_location', blank=True, null=True)
    locationname_comment = models.TextField(blank=True, null=True)
    locationname_reference = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.locationname or ''

    class Meta:
        managed = False
        db_table = 'locationname'

class Locationreference(models.Model):
    pk_location_reference = models.AutoField(primary_key=True)
    fk_event = models.ForeignKey('Event', models.DO_NOTHING, db_column='fk_event', related_name="fk_event_locationreference", blank=True, null=True)
    fk_locationname = models.ForeignKey('Locationname', models.DO_NOTHING, db_column='fk_locationname', blank=True, null=True)
    location_reference = models.TextField(blank=True, null=True)
    location_reference_primary = models.BooleanField(blank=True, null=True)
    fk_part = models.IntegerField(blank=True, null=True)
    fk_id_part = models.IntegerField(blank=True, null=True)
    fk_locationstatus = models.ForeignKey('Locationstatus', models.DO_NOTHING, db_column='fk_locationstatus', blank=True, null=True)
    locref_longitude = models.FloatField(blank=True, null=True)
    locref_latitude = models.FloatField(blank=True, null=True)

    # def __str__(self): 
    #     return self.location_reference or ''

    class Meta:
        managed = False
        db_table = 'location_reference'



class Locationstatus(models.Model):
    id_locationstatus = models.AutoField(primary_key=True)
    locationstatus = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'legendstatus'


class Locationtype(models.Model):
    pk_locationtype = models.IntegerField(primary_key=True)
    locationtype = models.CharField(max_length=255, blank=True, null=True)
    locationcomment = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'locationtype'


class Manifestation(models.Model):
    id_manifestation = models.AutoField(primary_key=True)
    #pk_manifestation = models.IntegerField(blank=True, null=True)
    fk_support = models.ForeignKey('Support', models.DO_NOTHING, db_column='fk_support', related_name='fk_support', blank=True, null=True)
    fk_position = models.ForeignKey('Position', models.DO_NOTHING, db_column='fk_position', related_name='fk_position',blank=True, null=True)
    fk_face = models.ForeignKey('Face', models.DO_NOTHING, db_column='fk_face', blank=True, null=True)
    fk_individual_producer = models.IntegerField(blank=True, null=True)
    fk_certainty_producer = models.IntegerField(blank=True, null=True)
    fragment = models.BooleanField(blank=True, null=True)
    size_vertical = models.IntegerField(blank=True, null=True)
    size_horizontal = models.IntegerField(blank=True, null=True)
    manifestation_legend = models.TextField(blank=True, null=True)
    manifestation_motif = models.TextField(blank=True, null=True)
    my_volume = models.IntegerField(blank=True, null=True)
    my_page = models.IntegerField(blank=True, null=True)
    manifestation_comment = models.TextField(blank=True, null=True)
    fullreference = models.TextField(blank=True, null=True)
    file_photograph = models.TextField(blank=True, null=True)
    briefreference = models.TextField(blank=True, null=True)
    id_repository = models.TextField(blank=True, null=True)
    datasetsussex = models.BooleanField(blank=True, null=True)
    datasetlondon = models.BooleanField(blank=True, null=True)
    datasetlondon_editionnumber = models.IntegerField(blank=True, null=True)
    datasetwales_sealnumber = models.IntegerField(blank=True, null=True)
    datasetwales_manifestationnumber = models.IntegerField(blank=True, null=True)
    datasetdl25 = models.BooleanField(blank=True, null=True)
    datasetdl25_manifestationnumber = models.IntegerField(blank=True, null=True)
    datasetdl25_expressionnumber = models.IntegerField(blank=True, null=True)
    datasetdl25_itemnumber = models.IntegerField(blank=True, null=True)
    datasetbirch = models.IntegerField(blank=True, null=True)
    datasetwales_manifestationsort = models.IntegerField(blank=True, null=True)
    ui_manifestation_repository = models.TextField(blank=True, null=True)
    fk_imagestate = models.ForeignKey('Imagestate', models.DO_NOTHING, db_column='fk_imagestate', blank=True, null=True)
    datasetbirch_v2 = models.IntegerField(blank=True, null=True)
    representative_set = models.BooleanField(blank=False, null=False)
    representative_set_broad = models.BooleanField(blank=False, null=False)
    label_manifestation_repository = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'manifestation'


class Material(models.Model):
    pk_material = models.AutoField(primary_key=True)
    material = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.material or ''

    class Meta:
        managed = False
        db_table = 'material'


class Month(models.Model):
    pk_month = models.AutoField(primary_key=True)
    month = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.month or ''

    class Meta:
        managed = False
        db_table = 'month'


class Nature(models.Model):
    pk_nature = models.AutoField(primary_key=True)
    nature_name = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.nature_name or ''

    class Meta:
        managed = False
        db_table = 'nature'


class Number(models.Model):
    pk_number = models.AutoField(primary_key=True)
    number = models.TextField(blank=True, null=True)
    number_alternate = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.number or ''

    class Meta:
        managed = False
        db_table = 'number'


class Office(models.Model):
    pk_office = models.AutoField(primary_key=True)
    office = models.TextField(blank=True, null=True)
    office_original = models.TextField(blank=True, null=True)
    office_order = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    fk_groupname = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.office or ''

    class Meta:
        managed = False
        db_table = 'office'



class Part(models.Model):
    id_part = models.AutoField(primary_key=True)
    #pk_part = models.IntegerField(blank=True, null=True)
    fk_item = models.ForeignKey('Item', models.DO_NOTHING, db_column='fk_item', blank=True, null=True)
    fk_event = models.ForeignKey('Event', models.DO_NOTHING, db_column='fk_event', blank=True, null=True)
    part_number1 = models.IntegerField(blank=True, null=True)
    part_number2 = models.IntegerField(blank=True, null=True)
    part_alpha1 = models.TextField(blank=True, null=True)
    part_alpha2 = models.TextField(blank=True, null=True)
    part_description = models.TextField(blank=True, null=True)
    part_transcription = models.TextField(blank=True, null=True)
    fk_dateapprox_part_start = models.SmallIntegerField(blank=True, null=True)
    part_daystart = models.SmallIntegerField(blank=True, null=True)
    fk_month_part_start = models.SmallIntegerField(blank=True, null=True)
    part_year_start = models.SmallIntegerField(blank=True, null=True)
    part_comment_start = models.TextField(blank=True, null=True)
    fk_dateapprox_part_end = models.SmallIntegerField(blank=True, null=True)
    part_dayend = models.SmallIntegerField(blank=True, null=True)
    fk_month_part_end = models.SmallIntegerField(blank=True, null=True)
    part_yearend = models.SmallIntegerField(blank=True, null=True)
    part_comment_end = models.TextField(blank=True, null=True)
    fk_period_part = models.SmallIntegerField(blank=True, null=True)
    part_comment = models.TextField(blank=True, null=True)
    fk_locationname = models.IntegerField(blank=True, null=True)
    part_comment_location = models.TextField(blank=True, null=True)
    id_repository_part = models.TextField(blank=True, null=True)
    ui_part_repository = models.TextField(blank=True, null=True)
    repository_startdate = models.DateField(blank=True, null=True)
    repository_enddate = models.DateField(blank=True, null=True)
    repository_location = models.TextField(blank=True, null=True)
    repository_description = models.TextField(blank=True, null=True)
    startdate = models.DateField(blank=True, null=True)
    enddate = models.DateField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    reference_full = models.TextField(blank=True, null=True)
    part_number3 = models.IntegerField(blank=True, null=True)
    part_number4 = models.IntegerField(blank=True, null=True)
    part_number5 = models.IntegerField(blank=True, null=True)
    published_full = models.TextField(blank=True, null=True)
    part_letter5 = models.TextField(blank=True, null=True)
    fordham_reference = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'part'


class Period(models.Model):
    pk_period = models.AutoField(primary_key=True)
    period = models.TextField(blank=True, null=True)
    fk_approx_start = models.IntegerField(blank=True, null=True)
    year_start = models.IntegerField(blank=True, null=True)
    fk_month_start = models.IntegerField(blank=True, null=True)
    day_start = models.IntegerField(blank=True, null=True)
    comment_start = models.TextField(blank=True, null=True)
    fk_approx_end = models.IntegerField(blank=True, null=True)
    year_end = models.IntegerField(blank=True, null=True)
    fk_month_end = models.IntegerField(blank=True, null=True)
    day_end = models.IntegerField(blank=True, null=True)
    comment_end = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'period'


class Position(models.Model):
    pk_position = models.AutoField(primary_key=True)
    position = models.TextField(blank=True, null=True)
    position_latin = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.position or ''

    class Meta:
        managed = False
        db_table = 'position'


class Prefix(models.Model):
    pk_prefix = models.AutoField(primary_key=True)
    prefix = models.TextField(blank=True, null=True)
    prefix_english = models.TextField(blank=True, null=True)
    fk_separator = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.prefix or ''

    class Meta:
        managed = False
        db_table = 'prefix'

class Printgroup(models.Model):
    pk_printgroup = models.AutoField(primary_key=True)
    printgroup = models.TextField(blank=True, null=True)
    printgroup_order = models.IntegerField(blank=True, null=True)
    printgroup_london = models.TextField(blank=True, null=True)
    exclude = models.IntegerField(blank=True, null=True) 

    def __str__(self): 
        return self.printgroup or ''

    class Meta:
        managed = False
        db_table = 'printgroup'


class Published(models.Model):
    pk_published = models.IntegerField(primary_key=True)
    published_reference_full = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'published'


class Referenceindividual(models.Model):
    pk_referenceindividual = models.AutoField(primary_key=True)
    referenceindividual = models.TextField(blank=True, null=True)
    fk_referencerole = models.ForeignKey('Referencerole', models.DO_NOTHING, db_column='fk_referencerole', blank=True, null=True)
    fk_event = models.ForeignKey('Event', models.DO_NOTHING, related_name="fk_event_event", db_column='fk_event', blank=True, null=True)
    fk_individualoffice = models.ForeignKey('Office', models.DO_NOTHING, related_name="fk_individualoffice_event", db_column='fk_individualoffice', blank=True, null=True)
    fk_individual_old = models.IntegerField(blank=True, null=True) 
    fk_individualnametype = models.IntegerField(blank=True, null=True)
    fk_individualnametitle = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_individualnametitle_event", db_column='fk_individualnametitle', blank=True, null=True)
    fk_descriptor_name = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_name_event", db_column='fk_descriptor_name', blank=True, null=True)
    fk_descriptor_prefix_1 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix_1_event", db_column='fk_descriptor_prefix_1', blank=True, null=True)
    fk_descriptor_1 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_1_event", db_column='fk_descriptor_1', blank=True, null=True)
    fk_descriptor_prefix_2 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix_2_event", db_column='fk_descriptor_prefix_2', blank=True, null=True)
    fk_descriptor_2 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor_2_event", db_column='fk_descriptor_2', blank=True, null=True)
    fk_descriptor_prefix_3 = models.ForeignKey('Prefix', models.DO_NOTHING, related_name="fk_descriptor_prefix_3_event", db_column='fk_descriptor_prefix_3', blank=True, null=True)
    fk_descriptor_3 = models.ForeignKey('Descriptor', models.DO_NOTHING, related_name="fk_descriptor3_event", db_column='fk_descriptor_3', blank=True, null=True)
    referencefullname = models.TextField(blank=True, null=True)
    referencecomment = models.TextField(blank=True, null=True)
    fk_relationship_node2 = models.IntegerField(blank=True, null=True)
    fk_individual = models.ForeignKey('Individual', models.DO_NOTHING, related_name="fk_individual_event", db_column='fk_individual', blank=True, null=True)
    fk_individual2 = models.IntegerField(blank=True, null=True)
    fk_individual3 = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.referenceindividual or ''

    class Meta:
        managed = False
        db_table = 'referenceindividual'


class Referencerole(models.Model):
    pk_referencerole = models.AutoField(primary_key=True)
    referencerole = models.TextField(blank=True, null=True)
    oldnumber = models.IntegerField(blank=True, null=True)
    role_order = models.IntegerField(blank=True, null=True)
    role_original = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.referencerole or ''

    class Meta:
        managed = False
        db_table = 'referencerole'

class Region(models.Model):
    region_label = models.TextField(blank=True, null=True)
    fk_locationtype = models.IntegerField(blank=True, null=True)
    fk_gazetteer = models.IntegerField(blank=True, null=True)
    pk_region = models.AutoField(primary_key=True)
    fk_regiondisplay = models.ForeignKey('Regiondisplay', models.DO_NOTHING, db_column='fk_regiondisplay', blank=True, null=True)
    fk_his_countylist = models.IntegerField(blank=True, null=True)
    fk_regiongrouping = models.IntegerField(blank=True, null=True) 

    def __str__(self): 
        return self.region_label or ''

    class Meta:
        managed = False
        db_table = 'region'


class Regiondisplay(models.Model):
    id_regiondisplay = models.AutoField(primary_key=True)
    regiondisplay_label = models.TextField(blank=True, null=True)
    regiondisplay_long = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    regiondisplay_lat = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    fk_geonames = models.IntegerField(blank=True, null=True)

    def __str__(self): 
        return self.regiondisplay_label or ''

    class Meta:
        managed = False
        db_table = 'region_display'



class RelationshipBranch(models.Model):
    fk_relationshipnode = models.ForeignKey('RelationshipNode', models.DO_NOTHING, db_column='fk_relationshipnode', blank=True, null=True)
    fk_individual = models.ForeignKey('Individual', models.DO_NOTHING, related_name='fk_individual_relationshipbranch', db_column='fk_individual', blank=True, null=True)
    fk_relationshiprole = models.ForeignKey('RelationshipRole', models.DO_NOTHING, db_column='fk_relationshiprole', blank=True, null=True)
    pk_branch = models.AutoField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'relationship_branch'


class RelationshipEvent(models.Model):
    pk_relationship_event = models.AutoField(primary_key=True)
    fk_event = models.ForeignKey('Event', models.DO_NOTHING, related_name='fk_event_relationshipevent', db_column='fk_event', blank=True, null=True)
    fk_relationship_node = models.IntegerField(blank=True, null=True)
    relationship_event = models.TextField(blank=True, null=True)
    fk_branch = models.IntegerField(blank=True, null=True)
    fk_referenceindividual = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'relationship_event'


class RelationshipNode(models.Model):
    pk_relationship_node = models.AutoField(primary_key=True)
    fk_event = models.ForeignKey('Event', models.DO_NOTHING, related_name='fk_event_relationshipnode', db_column='fk_event', blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    entry = models.TextField(blank=True, null=True)
    fk_event_start = models.IntegerField(blank=True, null=True)
    fk_event_stop = models.IntegerField(blank=True, null=True)
    start_day = models.IntegerField(blank=True, null=True)
    fk_start_month = models.IntegerField(blank=True, null=True)
    start_year = models.IntegerField(blank=True, null=True)
    end_day = models.IntegerField(blank=True, null=True)
    fk_end_month = models.IntegerField(blank=True, null=True)
    end_year = models.IntegerField(blank=True, null=True)
    date_start = models.DateField(blank=True, null=True)
    date_end = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'relationship_node'


class RelationshipRole(models.Model):
    relationship_role = models.CharField(max_length=50, blank=True, null=True)
    role_original = models.TextField(blank=True, null=True)
    role_order = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    old_number = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    pk_role = models.AutoField(primary_key=True)

    def __str__(self): 
        return self.relationship_role or ''

    class Meta:
        managed = False
        db_table = 'relationship_role'


class Repository(models.Model):
    pk_repository = models.AutoField(primary_key=True)
    repository = models.TextField(blank=True, null=True)
    repository_fulltitle = models.TextField(blank=True, null=True)
    id_archoncode = models.IntegerField(blank=True, null=True)
    archoncode_text = models.TextField(blank=True, null=True)
    archoncode_machine = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.repository_fulltitle or ''

    class Meta:
        managed = False
        db_table = 'repository'


class Representation(models.Model):
    id_representation = models.AutoField(primary_key=True)
    pk_representation = models.IntegerField()
    fk_digisig = models.IntegerField(blank=True, null=True)
    fk_contributor = models.ForeignKey('Contributor', models.DO_NOTHING, related_name='fk_contributor', db_column='fk_contributor', blank=True, null=True) 
    representation_date = models.DateTimeField(blank=True, null=True)
    fk_access = models.ForeignKey('Access', models.DO_NOTHING, related_name='fk_access', db_column='fk_access', blank=True, null=True)
    representation_filename = models.TextField(blank=True, null=True)
    #note there is a fk_collection_old -- but it links to the old pk identifier (single digit) in collection
    fk_collection_old = models.IntegerField(blank=True, null=True) 
    fk_collection = models.ForeignKey('Collection', models.DO_NOTHING, related_name='fk_collection', db_column='fk_collection', blank=True, null=True) 
    reference = models.TextField(blank=True, null=True)
    fk_contributor_creator = models.ForeignKey('Contributor', models.DO_NOTHING, related_name='fk_contributor_creator', db_column='fk_contributor_creator', blank=True, null=True) 
    representation_datecreated = models.DateField(blank=True, null=True)
    fk_connection = models.ForeignKey('Connection', models.DO_NOTHING, related_name='fk_connection', db_column='fk_connection', blank=True, null=True) 
    representation_thumbnail = models.TextField(blank=True, null=True)
    #note there is a primacy_v1 -- but I think it is deprecated
    primacy = models.BooleanField(blank=True, null=True)
    fk_representation_type = models.ForeignKey('RepresentationType', models.DO_NOTHING, related_name='fk_representation_type', db_column='fk_representation_type', blank=True, null=True)
    representation_folder = models.TextField(blank=True, null=True) 
    original_representation_filename = models.TextField(blank=True, null=True)
    original_representation_thumbnail = models.TextField(blank=True, null=True)
    original_fk_connection = models.IntegerField(blank=True, null=True)
    dimensions = models.TextField(blank=True, null=True)
    fk_rightsholder = models.ForeignKey('Rightsholder', models.DO_NOTHING, related_name='fk_rightsholder', db_column='fk_rightsholder', blank=True, null=True)
    width = models.IntegerField(blank=True, null=True)
    height = models.IntegerField(blank=True, null=True)
    fk_manifestation = models.ForeignKey('Manifestation', models.DO_NOTHING, related_name='fk_manifestation', db_column='fk_manifestation', blank=True, null=True) 
    representation_filename_hash = models.TextField(blank=True, null=True)
    representation_thumbnail_hash = models.TextField(blank=True, null=True)
    fk_part = models.ForeignKey('Part', models.DO_NOTHING, related_name='fk_part_representation', db_column='fk_part', blank=True, null=True)
    fk_sealdescription = models.ForeignKey('Sealdescription', models.DO_NOTHING, related_name='fk_sealdescription_representation', db_column='fk_sealdescription', blank=True, null=True)


    #https://stackoverflow.com/questions/2443752/django-display-image-in-admin-interface
    # def image_thumb(self):
    #     if self.representation_thumbnail:
    #         targetvalue = "https://f000.backblazeb2.com/file/repository-digisig/" + self.representation_thumbnail
    #         return mark_safe('<img src="%s" style="width: 45px; height:45px;" />' % targetvalue)
    #     else:
    #         return 'No Image Found'
    # image_thumb.short_description = 'Image'

    class Meta:
        managed = False
        db_table = 'representation'


class RepresentationType(models.Model):
    pk_representation_type = models.AutoField(primary_key=True)
    representation_type = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.representation_type or ''

    class Meta:
        managed = False
        db_table = 'representation_type'


class Rightsholder(models.Model):
    pk_rightsholder = models.AutoField(primary_key=True)
    rightsholder = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.rightsholder or ''

    class Meta:
        managed = False
        db_table = 'rightsholder'


class Seal(models.Model):
    pk_seal = models.IntegerField(blank=True, null=True)
    fk_individual_realizer = models.ForeignKey('Individual', models.DO_NOTHING, related_name='fk_individual_realizer', db_column='fk_individual_realizer', blank=True, null=True)
    fk_certainty_realizer = models.IntegerField(blank=True, null=True)
    fk_class = models.IntegerField(blank=True, null=True)
    datestart_seal = models.IntegerField(blank=True, null=True)
    dateend_seal = models.IntegerField(blank=True, null=True)
    biface_seal = models.BooleanField(blank=True, null=True)
    fk_timegroupa = models.IntegerField(blank=True, null=True)
    fk_timegroupb = models.IntegerField(blank=True, null=True)
    fk_timegroupc = models.ForeignKey('TimegroupC', models.DO_NOTHING, related_name='fk_timegroupc', db_column='fk_timegroupc', blank=True, null=True)
    datasetlondon = models.BooleanField(blank=True, null=True)
    datasetlondon_number = models.IntegerField(blank=True, null=True)
    datasetwales = models.BooleanField(blank=True, null=True)
    datasetwales_number = models.IntegerField(blank=True, null=True)
    datasetdl25 = models.BooleanField(blank=True, null=True)
    datasetdl25_number = models.IntegerField(blank=True, null=True)
    datasetdl25_individual = models.IntegerField(blank=True, null=True)
    datasetsussex = models.BooleanField(blank=True, null=True)
    fk_printgroup = models.ForeignKey('Printgroup', models.DO_NOTHING, related_name='fk_printgroup', db_column='fk_printgroup', blank=True, null=True)
    fk_actor_group = models.ForeignKey('Individual', models.DO_NOTHING, related_name='fk_actor_group', db_column='fk_actor_group', blank=True, null=True)
    fk_individual_office = models.ForeignKey('Office', models.DO_NOTHING, related_name='fk_individual_office', db_column='fk_individual_office', blank=True, null=True)
    priority = models.IntegerField(blank=True, null=True)
    printobverse_classmark = models.TextField(blank=True, null=True)
    printobverse_size = models.TextField(blank=True, null=True)
    printreverse_classmark = models.TextField(blank=True, null=True)
    printreverse_size = models.TextField(blank=True, null=True)
    legend_obverse = models.TextField(blank=True, null=True)
    legend_reverse = models.TextField(blank=True, null=True)
    motif_obverse = models.TextField(blank=True, null=True)
    motif_reverse = models.TextField(blank=True, null=True)
    printrealizer = models.TextField(blank=True, null=True)
    printclass = models.TextField(blank=True, null=True)
    comment_catalogue = models.TextField(blank=True, null=True)
    printcatalogue = models.TextField(blank=True, null=True)
    birch = models.BooleanField(blank=True, null=True)
    birchentry = models.TextField(blank=True, null=True)
    walessortnumber = models.IntegerField(blank=True, null=True)
    id_seal = models.BigAutoField(primary_key=True)
    pas_temp = models.IntegerField(blank=True, null=True)
    whittick_temp = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    dataset_ellisp = models.IntegerField(blank=True, null=True)
    fk_sealrole = models.IntegerField(blank=True, null=True)
    dataset_durham = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    bm_temp = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    gem = models.BooleanField(blank=True, null=True)
    ancientgem = models.IntegerField(blank=True, null=True)
    date_origin = models.IntegerField(blank=True, null=True)
    date_precision = models.IntegerField(blank=True, null=True)
    date_prediction = models.IntegerField(blank=True, null=True)
    date_prediction_node = models.IntegerField(blank=True, null=True)
    fk_sealtype = models.ForeignKey('Sealtype', models.DO_NOTHING, related_name='fk_sealtype', db_column='fk_sealtype', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'seal'
        # verbose_name_plural = 'Sealllls'


class Sealdescription(models.Model):
    pk_sealdescription = models.IntegerField()
    fk_collection = models.ForeignKey('Collection', models.DO_NOTHING, db_column='fk_collection', blank=True, null=True)
    sealdescription = models.TextField(blank=True, null=True)
    sealdescription_identifier = models.TextField(blank=True, null=True)
    fk_seal = models.ForeignKey('Seal', models.DO_NOTHING, db_column='fk_seal', related_name= 'fk_sealsealdescription', blank=True, null=True)
    bifaceseal = models.BooleanField(blank=True, null=True)
    motif_obverse = models.TextField(blank=True, null=True)
    motif_reverse = models.TextField(blank=True, null=True)
    legend_obverse = models.TextField(blank=True, null=True)
    legend_reverse = models.TextField(blank=True, null=True)
    fk_approx_horizontal = models.IntegerField(blank=True, null=True)
    sealsize_horizontal = models.IntegerField(blank=True, null=True)
    fk_approx_vertical = models.IntegerField(blank=True, null=True)
    sealsize_vertical = models.IntegerField(blank=True, null=True)
    shape = models.TextField(blank=True, null=True)
    catalogue_pagenumber = models.TextField(blank=True, null=True)
    catalogue_filename = models.TextField(blank=True, null=True)
    catalogue_date = models.TextField(blank=True, null=True)
    catalogue_size = models.TextField(blank=True, null=True)
    catalogue_orderingnumber = models.IntegerField(blank=True, null=True)
    sealdescription_title = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    fk_index = models.ForeignKey('TbIndex', models.DO_NOTHING, db_column='fk_index', blank=True, null=True)
    id_sealdescription = models.BigAutoField(primary_key=True)
    sealsize_horizontal_inch = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    sealsize_vertical_inch = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    fk_faction_horizontal_inch = models.IntegerField(blank=True, null=True)
    fk_fraction_vertical_inch = models.IntegerField(blank=True, null=True)
    catalogue_volume = models.TextField(blank=True, null=True)
    fk_contributor = models.IntegerField(blank=True, null=True)
    ui_catalogue = models.TextField(blank=True, null=True)
    fk_connection = models.IntegerField(blank=True, null=True)
    sealsize_inch_horiz_frac_p1 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    sealsize_inch_horiz_frac_p2 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    sealsize_inch_vert_frac_p1 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    sealsize_inch_vert_frac_p2 = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    location = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sealdescription'
        

class Sealrole(models.Model):
    pk_sealrole = models.AutoField(primary_key=True)
    sealrole = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sealrole'


class Sealtype(models.Model):
    id_sealtype = models.AutoField(primary_key=True)
    sealtype_description = models.TextField(blank=True, null=True)
    sealtype_time = models.TextField(blank=True, null=True)
    sealtype_place = models.TextField(blank=True, null=True)
    sealtype_bibliography = models.TextField(blank=True, null=True)
    sealtype_history = models.TextField(blank=True, null=True)
    sealtype_name = models.TextField(blank=True, null=True)
    sealtype_fk_class = models.IntegerField(blank=True, null=True)
    sealtype_example = models.IntegerField(blank=True, null=True)


    def __str__(self): 
        return self.sealtype_name or ''

    class Meta:
        managed = False
        db_table = 'sealtype'


class Separator(models.Model):
    pk_separator = models.AutoField(primary_key=True)
    separator = models.TextField(blank=True, null=True)
    separator_alternate = models.TextField(blank=True, null=True)
    separator_comment = models.TextField(blank=True, null=True)

    def __str__(self): 
        return self.separator_alternate or ''

    class Meta:
        managed = False
        db_table = 'separator'


class Series(models.Model):
    pk_series = models.AutoField(primary_key=True)
    fk_repository = models.ForeignKey('Repository', models.DO_NOTHING, related_name="fk_repository_series", db_column='fk_repository', blank=True, null=True)
    series_name = models.TextField(blank=True, null=True)
    series_alias = models.TextField(blank=True, null=True)
    series_abbreviated = models.TextField(blank=True, null=True)
    series_photocode = models.TextField(blank=True, null=True)
    series_edition = models.TextField(blank=True, null=True)
    series_uri = models.TextField(blank=True, null=True)
    series_fulltitle = models.TextField(blank=True, null=True)
    series_description = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    series_a1 = models.TextField(blank=True, null=True)
    series_n1 = models.IntegerField(blank=True, null=True)
    series_a2 = models.TextField(blank=True, null=True)
    series_n2 = models.IntegerField(blank=True, null=True)
    series_a3 = models.TextField(blank=True, null=True)
    series_n3 = models.IntegerField(blank=True, null=True)
    series_a4 = models.TextField(blank=True, null=True)
    series_n4 = models.IntegerField(blank=True, null=True)
    series_a5 = models.TextField(blank=True, null=True)
    series_n5 = models.IntegerField(blank=True, null=True)
    fk_separator_series = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_series", db_column='fk_separator_series', blank=True, null=True)
    fk_separator_a1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_a1", db_column='fk_separator_a1', blank=True, null=True)
    fk_separator_n1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_n1", db_column='fk_separator_n1', blank=True, null=True)
    fk_separator_a2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_a2", db_column='fk_separator_a2', blank=True, null=True)
    fk_separator_n2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_n2", db_column='fk_separator_n2', blank=True, null=True)
    fk_separator_a3 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_a3", db_column='fk_separator_a3', blank=True, null=True)
    fk_separator_n3 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_n3", db_column='fk_separator_n3', blank=True, null=True)
    identifier_a1 = models.BooleanField(blank=True, null=True)
    identifier_n1 = models.BooleanField(blank=True, null=True)
    identifier_a2 = models.BooleanField(blank=True, null=True)
    identifier_n2 = models.BooleanField(blank=True, null=True)
    identifier_a3 = models.BooleanField(blank=True, null=True)
    identifier_n3 = models.BooleanField(blank=True, null=True)
    fk_separator_event_a1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_event_a1", db_column='fk_separator_event_a1', blank=True, null=True)
    fk_separator_event_n1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_event_n1", db_column='fk_separator_event_n1', blank=True, null=True)
    fk_separator_event_a2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_event_a2", db_column='fk_separator_event_a2', blank=True, null=True)
    fk_separator_event_n2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_event_n2", db_column='fk_separator_event_n2', blank=True, null=True)
    fk_separator_prefix_a1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_a1", db_column='fk_separator_prefix_a1', blank=True, null=True)
    fk_separator_prefix_n1 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_n1", db_column='fk_separator_prefix_n1', blank=True, null=True)
    fk_separator_prefix_a2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_a2", db_column='fk_separator_prefix_a2', blank=True, null=True)
    fk_separator_prefix_n2 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_n2", db_column='fk_separator_prefix_n2', blank=True, null=True)
    fk_connection = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    fk_separator_prefix_a3 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_a3", db_column='fk_separator_prefix_a3', blank=True, null=True)
    fk_separator_prefix_n3 = models.ForeignKey('Separator', models.DO_NOTHING, related_name="fk_separator_prefix_n3", db_column='fk_separator_prefix_n3', blank=True, null=True)
    fk_separator_n1_variant = models.IntegerField(blank=True, null=True)
    fk_separator_series_v = models.IntegerField(blank=True, null=True)
    move = models.BooleanField(blank=True, null=True)
    representative = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'series'


class Shape(models.Model):
    pk_shape = models.AutoField(primary_key=True)
    shape = models.TextField(blank=True, null=True)
    shape_dl25 = models.TextField(blank=True, null=True)
    shape_consider = models.IntegerField(blank=True, null=True)
    round = models.IntegerField(blank=True, null=True)
    pointedoval = models.IntegerField(blank=True, null=True)
    roundedoval = models.IntegerField(blank=True, null=True)
    scutiform = models.IntegerField(blank=True, null=True)
    trianglepointingup = models.IntegerField(blank=True, null=True)
    unknown = models.IntegerField(blank=True, null=True)
    square = models.IntegerField(blank=True, null=True)
    lozenge = models.IntegerField(blank=True, null=True)
    drop = models.IntegerField(blank=True, null=True)
    undetermined = models.IntegerField(blank=True, null=True)
    trianglepointingdown = models.IntegerField(blank=True, null=True)
    rectangular = models.IntegerField(blank=True, null=True)
    hexagonal = models.IntegerField(blank=True, null=True)
    octagonal = models.IntegerField(blank=True, null=True)
    abnormal = models.IntegerField(blank=True, null=True)
    kite = models.IntegerField(blank=True, null=True)
    quatrefoil = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.shape

    class Meta:
        managed = False
        db_table = 'shape'


class Support(models.Model):
    id_support = models.AutoField(primary_key=True)
    #pk_support = models.IntegerField(blank=True, null=True)
    #fk_item = models.ForeignKey('Item', models.DO_NOTHING, related_name='fk_item', db_column='fk_item', blank=True, null=True)
    fk_item = models.IntegerField(blank=True, null=True)
    fk_part = models.ForeignKey('Part', models.DO_NOTHING, related_name='fk_part', db_column='fk_part', blank=True, null=True)
    fk_colour = models.IntegerField(blank=True, null=True)
    fk_attachment = models.ForeignKey('Attachment', models.DO_NOTHING, related_name='fk_attachment', db_column='fk_attachment', blank=True, null=True)
    fk_colourstain = models.IntegerField(blank=True, null=True)
    fk_material = models.ForeignKey('Material', models.DO_NOTHING, related_name='fk_material', db_column='fk_material', blank=True, null=True)
    fk_number_originalposition = models.IntegerField(blank=True, null=True)
    fk_number_currentposition = models.ForeignKey('Number', models.DO_NOTHING, related_name='fk_number_currentposition', db_column='fk_number_currentposition', blank=True, null=True)
    support_biface = models.BooleanField(blank=True, null=True)
    support_comment = models.TextField(blank=True, null=True)
    fk_nature = models.ForeignKey('Nature', models.DO_NOTHING, related_name='fk_nature', db_column='fk_nature', blank=True, null=True)
    temp_durham_support_pk = models.DecimalField(max_digits=65535, decimal_places=65535, blank=True, null=True)
    fk_supportstatus = models.ForeignKey('Supportstatus', models.DO_NOTHING, related_name='fk_supportstatus', db_column='fk_supportstatus', blank=True, null=True)


    class Meta:
        managed = False
        db_table = 'support'


class Supportstatus(models.Model):
    id_supportstatus = models.AutoField(primary_key=True)
    supportstatus = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.supportstatus

    class Meta:
        managed = False
        db_table = 'support_status'


class TbIndex(models.Model):
    pk_index = models.AutoField(primary_key=True)
    a_index = models.TextField(blank=True, null=True)
    index_order = models.IntegerField(blank=True, null=True)
    fk_repository = models.IntegerField(blank=True, null=True)
    index_url = models.TextField(blank=True, null=True)
    fk_catalogue = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tb_index'


class Terminology(models.Model):
    term_number = models.IntegerField()
    term_name = models.TextField(blank=True, null=True)
    term_notation = models.TextField(blank=True, null=True)
    term_definition = models.TextField(blank=True, null=True)
    term_title = models.TextField(blank=True, null=True)
    level = models.IntegerField(blank=True, null=True)
    level1 = models.IntegerField(blank=True, null=True)
    level2 = models.IntegerField(blank=True, null=True)
    level3 = models.IntegerField(blank=True, null=True)
    level4 = models.IntegerField(blank=True, null=True)
    level5 = models.IntegerField(blank=True, null=True)
    level6 = models.IntegerField(blank=True, null=True)
    level7 = models.IntegerField(blank=True, null=True)
    level8 = models.IntegerField(blank=True, null=True)
    level9 = models.IntegerField(blank=True, null=True)
    level10 = models.IntegerField(blank=True, null=True)
    fk_seal_example = models.IntegerField(blank=True, null=True)
    term_printphrase = models.TextField(blank=True, null=True)
    printindex = models.TextField(blank=True, null=True)
    term_sortorder = models.IntegerField(blank=True, null=True)
    datasetwales = models.BooleanField(blank=True, null=True)
    datasetlondon = models.BooleanField(blank=True, null=True)
    stub = models.TextField(blank=True, null=True)
    fk_face_example = models.IntegerField(blank=True, null=True)
    fk_representation_example = models.IntegerField(blank=True, null=True)
    id_term = models.AutoField(primary_key=True)
    term_deprecated = models.BooleanField(blank=True, null=True)
    aat = models.IntegerField(blank=True, null=True)
    cidoc_crm = models.IntegerField(blank=True, null=True)
    term_type = models.IntegerField(blank=True, null=True)
    fk_digisig = models.IntegerField(blank=True, null=True)
    digisig_column = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.term_name

    class Meta:
        managed = False
        db_table = 'terminology'


class Terminologyexample(models.Model):
    id_terminologyexample = models.AutoField(primary_key=True)
    fk_terminology = models.ForeignKey('Terminology', models.DO_NOTHING, related_name="fk_terminology", db_column='fk_terminology', blank=True, null=True)
    fk_representation = models.ForeignKey('Representation', models.DO_NOTHING, related_name="fk_representation", db_column='fk_representation', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'terminology_example'


class TimegroupC(models.Model):
    pk_timegroup_c = models.AutoField(primary_key=True)
    timegroup_c = models.IntegerField(blank=True, null=True)
    timegroup_c_range = models.TextField(blank=True, null=True)
    timegroup_c_startdate = models.IntegerField(blank=True, null=True)
    timegroup_c_finaldate = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'timegroup_c'