import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardComponent } from "./components/dashboard-component/dashboard-component";
import { StatsComponent } from "./components/stats-component/stats-component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardComponent, StatsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'frontend';
}
