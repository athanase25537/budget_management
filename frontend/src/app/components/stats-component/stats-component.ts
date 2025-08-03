import { Component } from '@angular/core';
import { GraphComponent } from "../graph-component/graph-component";

@Component({
  selector: 'app-stats-component',
  imports: [GraphComponent],
  templateUrl: './stats-component.html',
  styleUrl: './stats-component.scss'
})
export class StatsComponent {

}
