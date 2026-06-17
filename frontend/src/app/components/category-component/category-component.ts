import { Component, OnInit } from '@angular/core';
import { MiniCard } from '../mini-card/mini-card';
import { CategoryModel } from '../../models/category-model';
import { BudgetService } from '../../services/budget-service';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-component',
  imports: [MiniCard, CommonModule],
  templateUrl: './category-component.html',
  styleUrl: './category-component.scss'
})
export class CategoryComponent implements OnInit {
  categories: CategoryModel[] = [];
  filteredCategories: CategoryModel[] = [];

  constructor(private budgetService: BudgetService, private authService: AuthService) { }

  ngOnInit(): void {
    const user_id: number = this.authService.getCurrentUser()?.id || 1;
    console.log(user_id)
    this.budgetService.getCategoriesByUserId(user_id).subscribe({
      next: (data: any) => {
        this.categories = data;
        this.filteredCategories = data;
        console.log('Categories fetched successfully:', this.categories);
      }
    });
  }
}
