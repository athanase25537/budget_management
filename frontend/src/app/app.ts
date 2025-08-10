import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { BudgetService } from './services/budget-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'frontend';

  constructor(private budgetService: BudgetService) { }

  ngOnInit(): void {
    this.budgetService.welcome().subscribe({
      next: (data) => {
        console.log(data.message); 
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    });
  }
}
