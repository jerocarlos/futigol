import {Component} from "@angular/core";
import {FuseConfigService} from "../../../core/services/config.service";
import {FuseNavigationService} from "../../../core/components/navigation/navigation.service";
import {FuseNavigationModel} from "../../../navigation/navigation.model";

@Component({
  selector   : 'matches-component',
  templateUrl: './matches.component.html',
  styleUrls  : ['./matches.component.scss']
})

export class MatchesComponent {
  constructor(private fuseConfig: FuseConfigService, private fuseNavigationService: FuseNavigationService) {
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
}
