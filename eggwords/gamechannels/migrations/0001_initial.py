# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-12-11 19:19
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Word',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(max_length=128)),
            ],
        ),
        migrations.CreateModel(
            name='WordSet',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('max_length', models.IntegerField()),
                ('words', models.ManyToManyField(to='gamechannels.Word')),
            ],
        ),
    ]