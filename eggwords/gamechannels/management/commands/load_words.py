import itertools, os

from django.core.management.base import BaseCommand, CommandError

from gamechannels.models import Word, WordSet

THIS_DIR = os.path.dirname(os.path.abspath(__file__))


class Command(BaseCommand):
    help = 'Loads the word sets into the database.'

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        
        existing_words = set((w.word for w in Word.objects.all()))
        words_to_create = []

        with open(os.path.join(THIS_DIR, 'scrabble_dictionary.txt')) as all_words_file:      
            for word in all_words_file:
                norm_word = word.strip().lower()
                if norm_word and norm_word not in existing_words:
                    words_to_create.append(Word(word=norm_word))

        Word.objects.bulk_create(words_to_create)

        word_id_lookup = { w.word:w.id for w in Word.objects.all() }
        existing_letter_sets = set( (ws.letters for ws in WordSet.objects.all() ))
        
        with open(os.path.join(THIS_DIR, 'word_sets.txt')) as word_sets_file:
            for line in word_sets_file:
                split_line = line.split('::')
                longest = split_line[0].strip().lower()
                sorted_letters = ''.join(sorted(longest))
                if sorted_letters not in existing_letter_sets:
                    print(f'Adding word set for {longest}')
                    rest = split_line[1]
                    rest_words = [w.strip().lower() for w in rest.split(',')]
                    new_word_set = WordSet(max_length=len(longest), letters=sorted_letters)
                    new_word_set.save()
                    new_word_set.words.add(*[word_id_lookup[w] for w in rest_words])
