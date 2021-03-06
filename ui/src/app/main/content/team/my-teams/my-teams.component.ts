import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs/Observable';
import { fuseAnimations } from '../../../../core/animations';
import {MatDialog, MatPaginator, MatSnackBar, MatSort} from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { FuseUtils } from '../../../../core/fuseUtils';
import {TeamService} from "../../../../core/services/team.service";
import {AuthService} from "../../../../core/services/auth/auth.service";
import {Router} from "@angular/router";
import {FuseConfigService} from "../../../../core/services/config.service";
import {FuseNavigationService} from "../../../../core/components/navigation/navigation.service";
import {FuseNavigationModel} from "../../../../navigation/navigation.model";
import {Invite} from "../../../../core/models/invite/invite.model";
import {FuseConfirmDialogComponent} from "../../../../core/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector   : 'my-teams',
  templateUrl: './my-teams.component.html',
  styleUrls  : ['./my-teams.component.scss'],
  animations : fuseAnimations
})
export class MyTeamsComponent implements OnInit
{
  dataSource: FilesDataSource | null;
  displayedColumns = ['name', 'size', 'location', 'delete'];
  loggedUserId: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private router: Router,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private fuseConfig: FuseConfigService,
    private fuseNavigationService: FuseNavigationService) {
    this.fuseConfig.setSettings({
      layout: {
        navigation: 'top',
        toolbar   : 'above',
        footer    : 'none'
      },
      colorClasses    : {
        navbar: 'mat-fuse-dark-50-bg'
      }
    });
    this.fuseNavigationService.setNavigationModel(new FuseNavigationModel());
  }

  ngOnInit()
  {
    this.authService.loggedUser.then(user => {
      this.teamService.getTeams(user.id).then(x => {
        this.loggedUserId = user.id;
        this.dataSource = new FilesDataSource(this.teamService, this.paginator, this.sort);
        Observable.fromEvent(this.filter.nativeElement, 'keyup')
          .debounceTime(150)
          .distinctUntilChanged()
          .subscribe(() => {
            if ( !this.dataSource )
            {
              return;
            }
            this.dataSource.filter = this.filter.nativeElement.value;
          });
      });
    });
  }

  teamInfo(team) {
    this.router.navigate(['team', 'info', team.id]);
  }

  test(team) {
    const dialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      data: {
        confirmMessage: 'Estas seguro que querés abandonar ' + team.name + '?'
      }
    });
    dialogRef.afterClosed().subscribe(
      (data: any) => {
        if (data) {
          this.teamService.removePlayer({teamId: team.id, playerId: this.loggedUserId}).then( res => {
            if(res) {
              this.teamService.teams = this.teamService.teams.filter(x => team.id !== x.id);
              this.teamService.onTeamsChanged.next(this.teamService.teams);
              this.snackBar.open('El equipo fue abandonado con éxito.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            }
          }).catch(err => {
            if(JSON.parse(err._body).msg == 'Cant abandon team') {
              this.snackBar.open('El capitan no puede abandonar el equipo!', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            } else {
              this.snackBar.open('Hubo un error al desafiar al equipo. Por favor, inténtelo nuevamente.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            }
          });
        }
      }
    );
  }
}

export class FilesDataSource extends DataSource<any>
{
  _filterChange = new BehaviorSubject('');
  _filteredDataChange = new BehaviorSubject('');

  get filteredData(): any
  {
    return this._filteredDataChange.value;
  }

  set filteredData(value: any)
  {
    this._filteredDataChange.next(value);
  }

  get filter(): string
  {
    return this._filterChange.value;
  }

  set filter(filter: string)
  {
    this._filterChange.next(filter);
  }

  constructor(
    private teamService: TeamService,
    private _paginator: MatPaginator,
    private _sort: MatSort
  )
  {
    super();
    this.filteredData = this.teamService.teams;
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<any[]>
  {
    const displayDataChanges = [
      this.teamService.onTeamsChanged,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      let data = this.teamService.teams.slice();

      data = this.filterData(data);

      this.filteredData = [...data];

      data = this.sortData(data);

      // Grab the page's slice of data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    });
  }

  filterData(data)
  {
    if ( !this.filter )
    {
      return data;
    }
    return FuseUtils.filterArrayByString(data, this.filter);
  }

  sortData(data): any[]
  {
    if ( !this._sort.active || this._sort.direction === '' )
    {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch ( this._sort.active )
      {
        case 'id':
          [propertyA, propertyB] = [a.id, b.id];
          break;
        case 'name':
          [propertyA, propertyB] = [a.name, b.name];
          break;
        case 'categories':
          [propertyA, propertyB] = [a.categories[0], b.categories[0]];
          break;
        case 'price':
          [propertyA, propertyB] = [a.priceTaxIncl, b.priceTaxIncl];
          break;
        case 'quantity':
          [propertyA, propertyB] = [a.quantity, b.quantity];
          break;
        case 'active':
          [propertyA, propertyB] = [a.active, b.active];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  disconnect()
  {
  }
}
