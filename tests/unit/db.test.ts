import { describe, expect, it } from "vitest"

import { hashPassword, comparePassword } from "../../lib/db"

describe("password hashing", () => {
  it("hashes a password and verifies the match", async () => {
    const hash = await hashPassword("Str0ng!Passw0rd")
    expect(hash).not.toBe("Str0ng!Passw0rd")
    expect(await comparePassword("Str0ng!Passw0rd", hash)).toBe(true)
  })

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("Str0ng!Passw0rd")
    expect(await comparePassword("WrongPassword!1", hash)).toBe(false)
  })

  it("produces unique salts", async () => {
    const [a, b] = await Promise.all([hashPassword("same-pass"), hashPassword("same-pass")])
    expect(a).not.toBe(b)
  })
})
