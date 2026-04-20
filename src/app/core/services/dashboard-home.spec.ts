import { TestBed } from '@angular/core/testing';

import { DashboardHome } from './dashboard-home';

describe('DashboardHome', () => {
  let service: DashboardHome;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardHome);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
