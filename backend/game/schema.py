import graphene
from graphene_django import DjangoObjectType
from .models import Tribe, Tribesman

class TribesmanType(DjangoObjectType):
    class Meta:
        model = Tribesman
        fields = ("id", "name", "task", "is_alive")

class TribeType(DjangoObjectType):
    class Meta:
        model = Tribe
        fields = ("id", "name", "food", "wood", "stone", "population", "max_population", "hut_level")

class Query(graphene.ObjectType):
    tribe = graphene.Field(TribeType, id=graphene.Int(required=False))
    
    def resolve_tribe(self, info, id=None):
        if id:
            return Tribe.objects.filter(id=id).first()
        return Tribe.objects.first()

schema = graphene.Schema(query=Query)