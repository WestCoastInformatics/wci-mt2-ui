import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  searchText = '';
  
  columnDefs = [
    { field: 'refsetId', headerName: 'Reference Set', flex: 1, minWidth: 550, unSortIcon: true, sortable: true},
    { field: 'workflowStatus', headerName: 'Current Workflow Status', unSortIcon: true, sortable: true},
    { field: 'modified', tooltipField: 'modified', headerName: 'Last Modified', unSortIcon: true, sortable: true}
  ];

  data = [
    {refsetId: 'IHTSDO/SNOMED International Project/Atherosclerotic cardiovascular disease (ASCVD) …', workflowStatus: 'In Review (MHarry)', modified: '2022-01-01'},
    {refsetId: 'WestCoastInformatics/WCI Test MANAGED-SERVICE Project/Microorganism subset', workflowStatus: 'Ready for Review', modified: '2021-12-31'},
    {refsetId: 'WestCoastInformatics/WCI Test MANAGED-SERVICE Project/Nursing Procedures', workflowStatus: 'Ready for Edit', modified: '2021-12-09'},
    {refsetId: 'WestCoastInformatics/WCI Test MANAGED-SERVICE Project/Urval Covid-19', workflowStatus: 'In Edit (SWhalen)', modified: '2021-12-01'},
    {refsetId: 'IHTSDO/SNOMED International Project/General Practice / Family Practice reference set', workflowStatus: 'Review Completed', modified: '2021-11-28'},
    {refsetId: 'Organizaztion/Project/Place Holder reference set', workflowStatus: 'Review Completed', modified: '2021-10-28'},
    {refsetId: 'Organizaztion/Project/Place Holder reference set', workflowStatus: 'Review Completed', modified: '2021-10-28'},
    {refsetId: 'Organizaztion/Project/Place Holder reference set', workflowStatus: 'Review Completed', modified: '2021-10-28'},
    {refsetId: 'Organizaztion/Project/Place Holder reference set', workflowStatus: 'Review Completed', modified: '2021-10-28'},
    {refsetId: 'Organizaztion/Project/Place Holder reference set', workflowStatus: 'Review Completed', modified: '2021-10-28'}
  ];

  constructor(private readonly breadcrumbService: BreadcrumbService, private readonly titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Refset Tool - Dashboard');
    this.breadcrumbService.setBreadcrumbs([
      { path: '/dashboard', label: 'Dashboard' }
  ]);
  }

}
