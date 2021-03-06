import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {fuseAnimations} from "../../../../core/animations";
import {FuseUtils} from "../../../../core/fuseUtils";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {TeamService} from "../../../../core/services/team.service";
import {Subscription} from "rxjs/Subscription";
import {MatDialog, MatPaginator, MatSnackBar, MatSort, MatTableDataSource} from "@angular/material";
import {Team} from "../../../../core/models/team/team.model";
import {ActivatedRoute, Router} from "@angular/router";
import {FilesDataSource} from "../my-teams/my-teams.component";
import {Player} from "../../../../core/models/player/player.model";
import {AuthService} from "../../../../core/services/auth/auth.service";
import {FuseConfigService} from "../../../../core/services/config.service";
import {FuseNavigationService} from "../../../../core/components/navigation/navigation.service";
import {FuseNavigationModel} from "../../../../navigation/navigation.model";
import {DialogContentComponent} from "../../../../core/components/dialog/dialog-content.component";
import {PlayerService} from "../../../../core/services/player.service";
import {Location} from "../../../../core/models/location";
import {Challenge} from "../../../../core/models/challenge/challenge.model";
import {DateModel} from "../../../../core/models/utils/date.model";
import {Time} from "../../../../core/models/utils/time.model";
import {FuseConfirmDialogComponent} from "../../../../core/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector   : 'team-info',
  templateUrl: './team-info.component.html',
  styleUrls  : ['./team-info.component.scss'],
  animations : fuseAnimations
})
export class TeamInfoComponent implements OnInit
{
  team: Team;
  teamForm: FormGroup;
  teamPlayers: Player[];
  playerColumns = ['name', 'lastName', 'email', 'phone', 'position', 'captain'];
  captainColumns = ['name', 'lastName', 'email', 'phone', 'position', 'delete', 'captain'];
  matchColumns = ['sender', 'receiver', 'date', 'time'];
  playerDataSource: MatTableDataSource<Player>;
  matchDataSource: MatTableDataSource<any>;
  loggedPlayer: any;
  isCaptainBool: boolean;
  proposed: boolean;
  isTeamPlayer: boolean;
  captainTeams: Team[];
  locations: string[];
  sizes: number[];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private teamService: TeamService,
    private playerService: PlayerService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
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
    this.team = Team.empty();
    this.locations = new Location().options;
    this.sizes = [5, 7, 11];
    this.proposed = false;
    this.isTeamPlayer = false;
    this.captainTeams = [];
    this.isCaptainBool = false;
    this.authService.loggedUser.then(res => {this.loggedPlayer = res});
    this.teamPlayers = [];
    this.playerDataSource = new MatTableDataSource<Player>(this.teamPlayers);
    this.matchDataSource = new MatTableDataSource<Challenge>([]);
    this.teamForm = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', Validators.required),
      size: new FormControl('', Validators.required),
      location: new FormControl('', Validators.required)
    });
    this.route.params.subscribe( params =>
      this.teamService.getById(params.id)
        .then(res => {
          this.team = res;
          this.teamForm = this.formBuilder.group({
            id              : [this.team.id],
            name            : [this.team.name],
            size            : [this.team.size],
            location        : [this.team.location]
          });
          this.isCaptainBool = this.isCaptain();
          this.teamService.checkJoinRequest(this.team.id).then(res => {
            this.proposed = res;
          });
          this.teamService.getTeamPlayers(params.id)
            .then(players => {
              this.teamPlayers = players;
              this.isTeamPlayer = players.filter(x => x.id === this.loggedPlayer.id).length > 0;
              this.playerDataSource = new MatTableDataSource<Player>(this.teamPlayers);
              this.playerDataSource.paginator = this.paginator;
              this.playerDataSource.sort = this.sort;
            })
            .catch(err => {
              console.log(err);
            });

          this.teamService.getPastMatches(params.id)
            .then(matches => {
              let parsed = matches.map(x => { return {
                id: x.id,
                sender: x.sender,
                receiver: x.receiver,
                date: new DateModel(x.date.year, x.date.month, x.date.day, 0, 0, 0).toStringDate(),
                time: Time.timeModelFromTime(x.time).toStringTime(),
                location: x.location,
                state: x.state
              }});
              this.matchDataSource = new MatTableDataSource<any>(parsed);
              this.playerDataSource.paginator = this.paginator;
              this.playerDataSource.sort = this.sort;
            })
            .catch(err => {
              console.log(err);
            });
        })
        .catch(err => {
          console.log(err);
        })
    );
  }

  isCaptain() {
    return this.loggedPlayer.id === this.team.captain.id;
  }

  saveTeam() {
    this.teamService.update(this.teamForm.getRawValue())
      .then(res => {
        this.teamForm.reset();
        this.team = res;
        this.teamForm = this.formBuilder.group({
          id              : [this.team.id],
          name            : [this.team.name],
          size            : [this.team.size],
          location        : [this.team.location]
        });
        this.snackBar.open('Equipo actualizado correctamente.', '', {
          duration: 5000,
          verticalPosition: 'top'
        });
      }).catch(err => {
      this.snackBar.open('Hubo un error al actualizar el equipo. Por favor, inténtelo nuevamente.', '', {
        duration: 5000,
        verticalPosition: 'top'
      });
    })
  }

  challengeTeam() {
    this.playerService.getCaptainTeams(this.loggedPlayer.id).then(res => {
      this.captainTeams = res;
      if(this.captainTeams.length > 0) this.openChallengeDialog();
      else this.openEmptyDialog();
    }).catch(err => {
      console.log(err)
    });
  }

  joinRequest() {
    const dialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      data: {
        confirmMessage: 'Estas seguro que querés postularte para ' + this.team.name + '?'
      }
    });
    dialogRef.afterClosed().subscribe(
      (data: any) => {
        if (data) {
          this.teamService.joinRequest(this.team.id).then(res => {
            this.snackBar.open('El pedido se envió con éxito.', '', {
              duration: 5000,
              verticalPosition: 'top'
            });
            this.proposed = true;
          }).catch(err => {
            this.snackBar.open('Hubo un error al enviar el pedido. Por favor, inténtelo nuevamente', '', {
              duration: 5000,
              verticalPosition: 'top'
            });
          });
        }
      }
    );
  }

  deletePlayer(player) {
    const dialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      data: {
        confirmMessage: 'Estas seguro que querés echar del equipo a ' + player.name + ' ' + player.lastName + '?'
      }
    });
    dialogRef.afterClosed().subscribe(
      (data: any) => {
        if (data) {
          this.teamService.removePlayer({teamId: this.team.id, playerId: player.id}).then( res => {
            if(res) {
              this.playerDataSource.data = this.playerDataSource.data.filter(p => p.id !== player.id);
              this.snackBar.open('El jugador fue eliminado del equipo con éxito.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            }
          }).catch(err => {
              this.snackBar.open('Hubo un error al desafiar al equipo. Por favor, inténtelo nuevamente.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
          });
        }
      }
    );
  }

  back() {
    this.router.navigate(['team', 'general']);
  }

  redirectPlayer(player) {
    this.router.navigate(['players', 'info', player.id]);
  }

  openEmptyDialog() {
    this.dialog.open(DialogContentComponent, {
      panelClass: 'dialog',
      data: {
        title: 'Desafiar equipo',
        form:  new FormGroup({
          team: new FormControl('', Validators.required)
        }),
        element: {
          empty() {
            return { team: ''}
          }
        },
        emptyMessage: 'Para desafiar debes ser capitán de un equipo!',
        emptyMessageBool: true,
        formErrors: {},
        errorMessages: {}
      }
    });
  }

  openChallengeDialog() {
    const dialogRef = this.dialog.open(DialogContentComponent, {
      panelClass: 'dialog',
      data: {
        title: 'Desafiar equipo',
        form:  new FormGroup({
          sender: new FormControl('', Validators.required),
          location: new FormControl('', Validators.required),
          date: new FormControl('', Validators.required),
          time: new FormControl('', Validators.required)
        }),
        element: {
          empty() {
            return { team: '', location: '', date: '', time: ''}
          }
        },
        selects: [
          {
            placeholder: 'Equipo',
            options: this.captainTeams.map(x => {
              return {
                id: x.id,
                value: x.name
              }
            }),
            formControlName: 'sender'
          },
          {
            placeholder: 'Lugar',
            options: new Location().options.map(x => {
              return {
                id: x,
                value: x
              }
            }),
            formControlName: 'location'
          }
        ],
        dates: [
          {
            placeholder: 'Fecha',
            formControlName: 'date',
            min: new Date()
          }
        ],
        formInputs: [
          {
            placeholder: 'Hora',
            type: 'time',
            formControlName: 'time',
            hintLabel: ''
          }
        ],
        buttonLabel: 'DESAFIAR',
        formErrors: {},
        errorMessages: {}
      }
    });
    dialogRef.afterClosed().subscribe(
      (data: any) => {
        if (data) {
          let challenge: any;
          challenge = data;
          challenge.date = DateModel.dateModelFromDate(challenge.date.toDate());
          challenge.time = Time.timeModelFromString(challenge.time);
          challenge.receiver = this.team.id;
          this.teamService.challenge(challenge).then(res => {
            this.snackBar.open('El desafio se envió con éxito.', '', {
              duration: 5000,
              verticalPosition: 'top'
            });
          }).catch(err => {
            if(JSON.parse(err._body).msg == 'Team is busy') {
              this.snackBar.open('El equipo se encuentra ocupado en esa fecha y horario.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            } else {
              this.snackBar.open('Hubo un error al desafiar al equipo. Por favor, inténtelo nuevamente.', '', {
                duration: 5000,
                verticalPosition: 'top'
              });
            }
          })
        }
      }
    );
  }

}
