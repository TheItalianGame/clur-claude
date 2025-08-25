initial claude command:


I want to make a next+sqlite prototype for an ehr app
  This will be a calendar driven software
  There will be standard records like patient, session, etc
  Each will have a standard form that shows how it's displayed (subtabs, field order and more)
  A user will be able to create new records, where he will specify the fields with types, defaults etc and a table will
  be created including a standard form
  The user should be able to customize the form (which will create a new form) and modify how the record is displayed, 
  whether for a custom record or a native record

  For the calendar view, it should be (to start with) a monthly or weekly view
  For various dates of records such as create, timespan of event, maybe even deletes, they should show on the calander
  By default everybody will see all records that are relevant to them, so they'll be able to see on the calendar that they 
  created a lead for example, that they called a lead, etc, that a patient scheduled with them.
  Every record should have a color code that shows up on the calender in that color

  I'm hoping that we can store the record definitions and field definitions and form definitions on a table (obviously to 
  actually store the records it needs its own table)
  I'm going to need you to create an interface to make new custom records and forms.

  For the weekly calendar it should show the title of the record, for the monthly it should just show a circle.
  Hovering should expand the marker into a box where it shows the record detail

  Please prototype this app and make some default record including employee, patient, visit, meeting, etc.


