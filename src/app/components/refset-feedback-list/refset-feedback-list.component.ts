import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Refset } from 'src/app/models/refset';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';

@Component({
  selector: 'app-refset-feedback-list',
  templateUrl: './refset-feedback-list.component.html'
})
export class RefsetFeedbackListComponent implements OnInit {

  @ViewChild('topicNameSection') nameSection: TemplateRef<any>;
  @ViewChild('topicModal') topicModal: TemplateRef<NgbModal>;
  
  data = [];
  discussions = [
    {
      author: 'Jesse Efron', pic: 'assets/sampels/profile/2.svg', date: '2022-03-12  02:38:19', locked: false,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.'
    },
    {
      author: 'Tim Williams', pic: 'assets/sampels/profile/3.svg', date: '2022-03-13  10:03:20', locked: true,
      content: 'Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus sit pulvinar tempor sit et'
    },
    {
      author: 'Wendy Boeger', pic: 'assets/sampels/profile/4.svg', date: '2022-03-14 11:43:29', locked: false,
      content: 'Most recent entry goes here. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus sit.'
    },
    {
      author: 'Jesse Efron', pic: 'assets/sampels/profile/5.svg', date: '2022-03-15  02:38:19', locked: false,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.'
    },
    {
      author: 'Jesse Efron', pic: 'assets/sampels/profile/2.svg', date: '2022-03-16  02:38:19', locked: false,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.'
    },
    {
      author: 'Jesse Efron', pic: 'assets/sampels/profile/3.svg', date: '2022-03-17  02:38:19', locked: false,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.'
    },
    {
      author: 'Jesse Efron', pic: 'assets/sampels/profile/4.svg', date: '2022-03-18  02:38:19', locked: false,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.'
    },
  ];

  refsetGridOptions = {};
  topic: string;

  columnDefs = [];
  @Input() refset: Refset;

  constructor(private readonly modalService: NgbModal) { }

  ngOnInit() {

    this.data = [
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/1.svg', topic: 'Consider adding long covid symptoms to this refset', lock: false, status: 'Open', lastComment: '2022-03-18', replies: 4, visibility: 'Visible' },
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/2.svg', topic: 'Is there a need for inclusion of Dyspnea? Suggesting an alternate like that… ', lock: false, status: 'Resolved', lastComment: '2022-03-15', replies: 10, visibility: 'Visible' },
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/3.svg', topic: 'Can you add more information on the purpose of the refset?', lock: true, status: 'Open', lastComment: '2022-03-14', replies: 2, visibility: 'Visible' },
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/4.svg', topic: 'It might be helpful to compare this refset to Covid-19 Refset authored by… ', lock: false, status: 'Open', lastComment: '2022-03-08', replies: 0, visibility: 'Visible' },
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/5.svg', topic: 'Infection of upper respiratory tract caused by severe acute respiratory sy…', lock: false, status: 'Open', lastComment: '2022-02-26', replies: 13, visibility: 'Hidden' },
      { name: 'Steph Whalen', pic: 'assets/sampels/profile/6.svg', topic: 'What are your thoughts about the connection to exposure sources?', lock: false, status: 'Open', lastComment: '2022-02-11', replies: 3, visibility: 'Visible' }
    ];

    this.refsetGridOptions = {
      context: { componentParent: this },
      onCellClicked: this.onGridCellClick,
      defaultColDef: { filter: true, suppressMenu: true, floatingFilter: true, unSortIcon: true, sortable: true, flex: 1 },
      frameworkComponents: {
        'templateRenderer': TemplateRenderer,
        'categoryFilterComponent': CategoryFilterComponent
      },
    };

    this.columnDefs = [
      {
        field: 'name', headerName: 'Author', cellRenderer: params => {
          return `<img class='profile-pic' src='${params.data.pic}' /> ${params.data.name}`;
        }
      },
      {
        field: 'topic', headerName: 'Feedback Topic', minWidth: 300, cellRenderer: params => {
          return `<a class='text-main pointer'>${params.value}</a>` + (params.data.locked? '<i class="ml-3 text-muted fa fa-lock" *ngIf="params.data.locked"></i>' : '');
        }
      },
      {
        field: 'status', headerName: 'Status', floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
          suppressFilterButton: true, names: [
            { type: 'status', name: 'All', value: '' },
            { type: 'status', name: 'Open', value: 'Open' },
            { type: 'status', name: 'Resolved', value: 'Resolved' }
          ]
        }
      },
      { field: 'lastComment', headerName: 'Last Comment' },
      { field: 'replies', headerName: 'Replies' },
      { field: 'visibility', headerName: 'visibility', cellClass: 'text-primary font-weight-bold', floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
        suppressFilterButton: true, names: [
          { type: 'status', name: 'All', value: '' },
          { type: 'status', name: 'Visible', value: 'Visible' },
          { type: 'status', name: 'Hidden', value: 'Hidden' }
        ]
      } }]
  }
  onGridCellClick = (event) => {

    if (event.column.colId === 'topic') {
      this.topic = event.data.topic;
      this.modalService.open(this.topicModal, {
        modalDialogClass: 'full-modal',
        centered: true
        //backdrop : 'static',
        //keyboard : false,
      });
    }
  }

  onTopicClick(row){
    console.log(row);
  }

  get dataCount() {
    return this.data.length;
  }
}
