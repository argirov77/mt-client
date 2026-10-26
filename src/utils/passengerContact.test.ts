import { test } from "node:test";
import * as assert from "node:assert/strict";

import {
  checkPassengerPhone,
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

test("checkPassengerPhone accepts full numbers with a country code", () => {
  assert.deepEqual(checkPassengerPhone("+380 50 123 4567"), { ok: true });
  assert.deepEqual(checkPassengerPhone("+359 89 429 0356"), { ok: true });
  assert.deepEqual(checkPassengerPhone("+40 721 234 567"), { ok: true });
});

test("checkPassengerPhone rejects empty, codeless and short numbers", () => {
  assert.equal(checkPassengerPhone("").ok, false);
  assert.equal(checkPassengerPhone("+380").ok, false);
  const short = checkPassengerPhone("+380 50 123 45");
  assert.equal(short.ok, false);
  if (!short.ok) {
    assert.equal(short.reason, "length");
    assert.equal(short.expectedDigits, 9);
  }
  const noCode = checkPassengerPhone("050 123 4567");
  assert.equal(noCode.ok, false);
  if (!noCode.ok) assert.equal(noCode.reason, "no_code");
});
