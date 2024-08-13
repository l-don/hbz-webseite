import { TestBed } from '@angular/core/testing';

import { CommentsFirebaseService } from './comments-firebase.service';

describe('CommentsFirebaseService', () => {
  let service: CommentsFirebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentsFirebaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
