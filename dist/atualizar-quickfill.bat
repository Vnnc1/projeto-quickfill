@echo off
title QuickFill - instalar / atualizar
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Vnnc1/projeto-quickfill/master/dist/quickfill.ps1 | iex"
