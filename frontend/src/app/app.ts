import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { BudgetService } from './services/budget-service';
import { UserModel } from './models/user-model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  
  protected title = 'frontend';

  user: UserModel = new UserModel(0, "user", "user", "username", "1234", 0);
  
  constructor(private budgetService: BudgetService) { }

  ngOnInit(): void {
    this.budgetService.getUser().subscribe({
      next: (data: any) => {
        this.user = data
      },
      error: (err) => {
        console.error('Erreur:', err);
      }
    })
  }
}
