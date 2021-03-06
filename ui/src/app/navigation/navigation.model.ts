import { FuseNavigationModelInterface } from '../core/components/navigation/navigation.model';

export class FuseNavigationModel implements FuseNavigationModelInterface
{
    public model: any[];

    constructor()
    {
        this.model = [
          {
            'id'      : 'players',
            'title'   : 'Jugadores',
            'type'    : 'item',
            'url'     : 'players'
          },
          {
            'id'      : 'teams',
            'title'   : 'Equipos',
            'type'    : 'collapse',
            'children' : [
              {
                'id'       : 'create',
                'title'    : 'Crear Equipo',
                'type'     : 'item',
                'url'      : 'team/create'
              },
              {
                'id'       : 'my_teams',
                'title'    : 'Mis Equipos',
                'type'     : 'item',
                'url'      : 'team/general'
              },
              {
                'id'       : 'search-team',
                'title'    : 'Buscar equipo',
                'type'     : 'item',
                'url'      : 'team/search'
              }
            ]
          },
          {
            'id'      : 'matches',
            'title'   : 'Partidos',
            'type'    : 'collapse',
            'children' : [
              {
                'id'       : 'pending',
                'title'    : 'Pendientes',
                'type'     : 'item',
                'url'      : 'matches/pending'
              },
              {
                'id'       : 'confirmed',
                'title'    : 'Confirmados',
                'type'     : 'item',
                'url'      : 'matches/confirmed'
              }
            ]
          }
        ];
    }
}
