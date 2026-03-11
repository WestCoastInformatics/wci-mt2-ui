import { Subscription } from 'rxjs';
import { ElementRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'app-mapset-mapping',
	templateUrl: './mapset-mapping.component.html',
	styleUrls: ['./mapset-mapping.component.css'],
})
export class MapsetMappingComponent implements OnInit {
	user: User;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
	refsetGridApi: any;
	columnDefs = [];
	refsetGridColumns = [
		{ name: 'information', show: true },
		{ name: 'refsetId', show: true },
	];
	rowSelection = 'multiple';
	refsetGridOptions: any;
	refsetGridPaging = {
		pageSize: 10,
		pageSizeOptions: [10, 25, 50, 100],
		totalKnown: false,
		totalRows: null,
		manualStateRefresh: Boolean(true),
	};
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	showTable = false;
	mapsetData = [];
	dialog: DialogService;
	versionStatuses: any;
	versions: any;
	organizations: any;
	initialGridWidth: number;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl: string;
	numOfMembers: any;
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	searchCallArray = [];
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	downloadModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	mapsetCode: string;
	conceptCode: string;
	mapping: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	internationalId = '449080006';
	loaded = false;
	downloadError = '';
	downloading = false;
	selectedFormat = {};
	formats = [];
	downloadTitle = 'Download';
	mapsetInfo: any = {};
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	moduleMetadata: any;
	refsetData: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('directorySearchInput') private directorySearchInput: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private refsetService: RefsetService,
		private mt2Service: MT2Service,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private modalService: NgbModal,
	) {
		document.body.scrollTop = 0;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Map');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.conceptCode = routeParams.concept;
			this.getMapsetInfo();
			this.getMapsetData();
			this.getModuleMetadata();
		});

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(1, 0, { value: 'rf2_with_names', display: 'RF2 With Names' });
		}

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(-1, 0, { value: 'freeset', display: 'Free Set' });
		}

		this.disableChannel.postMessage(false);
	}

	getMapsetInfo() {
		this.refsetService.getMapsets().subscribe({
			next: (results) => {
				const thisResult = results.filter((res) => {
					return res.refSetCode === this.mapsetCode;
				});
				this.mapsetName = thisResult[0]?.refSetName;
			},
		});

		this.refsetService.getMapsetByCode(this.mapsetCode).subscribe((results) => {
			this.mapsetInfo = results;
		});
	}

	getModuleMetadata() {
		if (this.mt2Service.moduleMetadata.value?.length === 0) {
			this.refsetService.getMetadata().subscribe({
				next: (results) => {
					this.mt2Service.setModuleMetadata(results);
					this.moduleMetadata = results;
				},
			});
		} else {
			this.moduleMetadata = this.mt2Service.moduleMetadata.value;
		}
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetConceptList(this.mapsetCode, this.conceptCode).subscribe({
			next: (response) => {
				this.loaded = true;
				const data = [];
				let count = 0;
				const results = response.items[0];

				for (let b = 0; b < results.mapEntries.length; b++) {
					let spanned = false;
					if (results.mapEntries.length > 1) {
						if (b >= 1) {
							spanned = true;
						}
					} else {
						results.mapEntries[b].group = '';
					}
					const adviceArray = [];
					for (let i = 0; i < results.mapEntries[b].advices.length; i++) {
						if (results.mapEntries[b].advices[i] !== '') {
							adviceArray.push(results.mapEntries[b].advices[i]);
						}
					}
					data.push({
						index: results.code + count,
						spanned: spanned,
						downloadable: true,
						mapEntries: results.mapEntries,
						descriptions: results.descriptions,
						entries: results.mapEntries.length,
						code: results.code,
						name: results.name,
						toName:
							results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST'
								? results.mapEntries[b].toName
								: '---',
						toCode:
							results.mapEntries[b].toCode.length > 0
								? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
								: 'No map entries available.',
						rule: results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
						relation: results.mapEntries[b].relation.length > 0 ? results.mapEntries[b].relation : '---',
						modified: results.mapEntries[b].modified,
						advices: { number: adviceArray.length, list: adviceArray },
						group: results.mapEntries[b].group,
						priority: results.mapEntries[b].priority,
						moduleId: results.mapEntries[b].moduleId,
						modFlag: this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
						modLang: this.getModuleLanguageName(results.mapEntries[b].moduleId),
					});
					count++;
				}

				this.mapsetData = data;

				this.breadcrumbService.setBreadcrumbs([
					{ path: '/library', label: 'Library' },
					{ path: '/mapset/' + this.mapsetCode + '/mappings', label: this.mapsetName },
					{ label: this.mapsetData.length > 0 ? this.mapsetData[0]?.name : 'Map' },
				]);
			},
			error: (error) => {
				//
			},
		});
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				flag = data.countryCode;
			}
		});
		return flag;
	}

	getModuleLanguageName(moduleId: string) {
		let lang = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				lang = data.name;
			}
		});
		return lang;
	}

	menuOpened() {
		this.directorySearchInput.nativeElement.focus();
	}

	selectAction(action: string) {
		switch (action) {
			case 'edit':
				if (action === 'edit') {
					const ddInterval = setInterval(() => {
						this.goToEditMappingPage();
						clearInterval(ddInterval);
					}, 2);
				}
				break;
			case 'review':
				this.openToBeDevelopedModal(this.tbdModal);
				break;
		}
	}

	clearSearch() {
		this.loaded = false;
		if (this.searchInput) {
			this.searchInput = '';
			this.onSearchChange();
		}
	}

	@Debounce()
	onSearchChange() {
		this.searchInput = this.searchInput.trim();
		if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
			this.openToBeDevelopedModal(this.tbdModal);
		}
	}

	goToEditMappingPage() {
		this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode + '/edit'], {
			replaceUrl: false,
			skipLocationChange: false,
		});
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	downloadMapsets() {
		this.downloadTitle = 'Download ' + this.mapsetData[0].code + ' ' + this.mapsetData[0].name;
		this.formats = [{ value: 'tab', display: 'Tab-Delimited Text File' }];
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.downloadError = '';
		if (this.selectedFormat['value'] !== undefined) {
			this.downloading = true;
			const cols = ['Source', 'Source PT', 'Target', 'Target PT', 'Relationship', 'Rule', 'Advices', 'Last Modified'];
			const params = {
				conceptCodes: [this.mapsetData[0].code],
				columnNames: cols,
			};
			this.refsetService.exportMapsetByCode(this.mapsetInfo.refSetCode, params).subscribe(
				(data) => {
					this.uiUtility.createMapsetReport(this.mapsetInfo.refSetCode, data);
					this.downloading = false;
					this.closeDownloadModal();
				},
				(err) => {
					console.error(err);
				},
			);
		} else {
			this.downloadError = 'Please select a download format.';
		}
	}

	openDownloadModal(content) {
		this.downloadModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeDownloadModal() {
		this.downloadError = '';
		this.selectedFormat = {};
		this.downloadModalRef.close();
		this.isModalOpen = false;
	}

	//***** General Functions *****/

	openToBeDevelopedModal(content) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	dateFormatter(val): any {
		return UiUtility.dateFormatter(val);
	}

	onResize(event) {
		const sectionWidth = $('.section-background').parent().width();
		document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${sectionWidth}px;`);
		//this.resizeSectionView();
	}
}
