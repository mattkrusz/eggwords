import pytest

from gamechannels.models import WordSet, Word

test_letters_1 = ''.join(sorted('clotted'))
test_set_1 = ['clod', 'code', 'tel', 'ole', 'toted', 'lotted', 'colt', 'ted', 'dole', 'clot', 'deco', 'clotted', 'tot', 'old', 'cold', 'cole', 'tet', 'ode', 'dolt', 'lotte', 'coted', 'tote', 'dottel', 'celt', 'octet', 'eld', 'dolce', 'lot', 'tod', 'toe', 'led', 'coed', 'telco', 'dottle', 'cel', 'lode', 'tole', 'cote', 'let', 'delt', 'dote', 'toled', 'cot', 'dol', 'doc', 'doe', 'del', 'cod', 'toed', 'told', 'coled', 'col', 'dot']


@pytest.mark.django_db
def test_random_word_set():
    
    ws = WordSet(max_length=7, letters=test_letters_1)
    ws.save()

    for w in test_set_1:
        word = Word(word=w)
        word.save()
        ws.words.add(word.id)

    random_wordset = WordSet.objects.random()
    assert random_wordset.letters == test_letters_1
    assert random_wordset.words.count() == len(test_set_1)
