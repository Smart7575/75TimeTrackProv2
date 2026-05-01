# Security Specification for 75TimeTrackPro v2

## Data Invariants
1. A project cannot be created without a name and client.
2. An activity must belong to a project and have a name and classification.
3. A time entry must have a valid projectId, activityId, startTime, and endTime.
4. All resources must be owned by the user who created them (`userId`).
5. Users can only access their own sub-collections under `users/{userId}/`.

## The "Dirty Dozen" Payloads (Red Team Tests)
1. **Identity Theft**: User A trying to create a project in User B's collection.
2. **PII Leak**: User A trying to read User B's settings.
3. **Shadow Update**: Adding an `isAdmin: true` field to a project document.
4. **Invalid ID**: Injecting a 2KB string as a project ID.
5. **Orphaned Write**: Creating a time entry for a project that doesn't exist.
6. **Future Entry**: Setting `startTime` to a future date manually (bypassing client logic).
7. **Negative Duration**: Setting `durationInMinutes` to -10.
8. **Status Bypass**: Changing a project's `archived` status if it's already in a "permanent" state (if applicable).
9. **Bulk Delete**: Attempting to delete all projects at once without ownership check.
10. **Resource Exhaustion**: Sending 1MB of text in the `notes` field of a time entry.
11. **Type Mismatch**: Sending a string for `budget` instead of a number.
12. **System Field Injection**: Trying to modify `createdAt` or `userId` after creation.

## The Test Runner (firestore.rules)
Wait for rule generation.
