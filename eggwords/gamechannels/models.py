from random import randint

from django.db import models

class Word(models.Model):
    word = models.CharField(max_length=128, db_index=True,)

class WordSetManager(models.Manager):
    '''
    Adds extra “table-level” functionality to the WordSet model, particularly the ability to select a random word set.
    '''
    def random(self):
        count = self.count()
        if count > 0:
            random_offset = randint(0, count - 1)
            return self.all()[random_offset]
        raise Exception("No word sets are in the database.")

class WordSet(models.Model):
    objects = WordSetManager()

    max_length = models.IntegerField()
    letters = models.CharField(max_length=128)
    words = models.ManyToManyField(Word)
