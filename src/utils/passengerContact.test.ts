import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  isValidPassengerEmail,
  normalizePassengerContact,
} from "./passengerContact";

test("normalizePassengerContact trims email, phone and passenger names", () => {
  const result = normalizePassengerContact({
    email: "  user@example.com  ",
    phone: "  +380 50 123 45 67  ",
    passengerNames: ["  Alice  ", " Bob", "Charlie   "],
  });

  assert.deepEqual(result, {
    email: "user@example.com",
    phone: "+380 50 123 45 67",
    passengerNames: ["Alice", "Bob", "Charlie"],
  });
});

test("isValidPassengerEmail accepts valid common addresses", () => {
  assert.equal(isValidPassengerEmail("user@example.com"), true);
  assert.equal(isValidPassengerEmail(" USER.NAME+tag@sub.domain.co "), true);
  assert.equal(isValidPassengerEmail("name_surname@domain.travel"), true);
});

test("isValidPassengerEmail rejects invalid formats and edge-cases", () => {
  const invalidEmails = [
    "",
    "plainaddress",
    "missing-at.example.com",
    "user@localhost",
    "user@",
    "@example.com",
    "user..dots@example.com",
    ".leadingdot@example.com",
    "trailingdot.@example.com",
    "user@-example.com",
    "user@example-.com",
    "user@example..com",
    "user name@example.com",
    "user@exam_ple.com",
  ];

  for (const invalidEmail of invalidEmails) {
    assert.equal(
      isValidPassengerEmail(invalidEmail),
      false,
      `Expected ${invalidEmail || "<empty>"} to be invalid`
    );
  }
});

test("isValidPassengerEmail enforces local and total length limits", () => {
  const localPartOverLimit = `${"a".repeat(65)}@example.com`;
  const totalOverLimit = `${"a".repeat(64)}@${"b".repeat(185)}.com`;

  assert.equal(isValidPassengerEmail(localPartOverLimit), false);
  assert.equal(isValidPassengerEmail(totalOverLimit), false);
});
