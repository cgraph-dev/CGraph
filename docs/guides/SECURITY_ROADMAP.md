# Security Roadmap

This document outlines CGraph's security maturity journey. Our goal is transparent communication
about where we are today and where we're headed.

## Current Status: Alpha Security

**Last Updated**: 2025-01-22

CGraph's end-to-end encryption is **functional and follows cryptographic best practices**, but it
has not undergone formal third-party security audit.

### What We Have Today

| Component                 | Status           | Details                                        |
| ------------------------- | ---------------- | ---------------------------------------------- |
| **E2EE Implementation**   | ✅ Complete      | Signal Protocol-inspired X3DH + Double Ratchet |
| **Encryption Algorithm**  | ✅ AES-256-GCM   | Industry-standard authenticated encryption     |
| **Key Exchange**          | ✅ P-256 ECDH    | NIST-approved curve via Web Crypto API         |
| **Forward Secrecy**       | ✅ Per-message   | Double Ratchet key rotation                    |
| **Break-in Recovery**     | ✅ Implemented   | New keys heal after compromise                 |
| **Rate Limiting**         | ✅ Comprehensive | Per-endpoint, per-user, per-IP                 |
| **Authentication**        | ✅ Argon2id      | OWASP-recommended password hashing             |
| **2FA**                   | ✅ TOTP          | Brute-force protected                          |
| **Audit Logging**         | ✅ Comprehensive | 30+ event types                                |
| **Third-Party Audit**     | ❌ Not Yet       | Planned for Phase 2                            |
| **Libsignal Integration** | ❌ Not Yet       | Custom implementation                          |
| **Bug Bounty Program**    | ❌ Not Yet       | Planned for Phase 3                            |

### Honest Assessment

**Strengths:**

- Well-established cryptographic primitives (P-256, AES-256-GCM, HKDF-SHA256)
- Protocol design follows Signal Protocol patterns
- Comprehensive rate limiting and abuse protection
- Zero-knowledge server (plaintext never touches backend)
- Forward secrecy with per-message key rotation

**Areas for Improvement:**

- Custom crypto implementation (not battle-tested libsignal)
- No formal security audit
- Limited penetration testing
- No bug bounty program
- Post-quantum readiness is placeholder only

---

## Phase 1: Foundation (Current - Q2 2025)

**Goal**: Establish security baseline and documentation transparency.

### Completed

- [x] Signal Protocol-inspired E2EE implementation
- [x] Cross-platform curve standardization (P-256)
- [x] Comprehensive rate limiting system
- [x] Audit logging infrastructure
- [x] Security documentation overhaul
- [x] Marketing claims accuracy review

### In Progress

- [ ] E2EE unit test coverage to 90%+
- [ ] Cross-platform E2EE integration tests (web ↔ mobile)
- [ ] Key serialization format documentation
- [ ] Threat model documentation

### Planned

- [ ] Internal security review by cryptography-aware team members
- [ ] Dependency security audit (npm audit, mix audit)
- [ ] Static analysis tooling (Semgrep, CodeQL)

---

## Phase 2: External Validation (Q3-Q4 2025)

**Goal**: Third-party security audit and professional penetration testing.

### Planned

- [ ] **Cryptographic Code Review**
  - Focus: `apps/web/src/lib/crypto/` and `apps/mobile/src/lib/crypto/`
  - Scope: X3DH, Double Ratchet, key serialization, ECDH implementation
  - Deliverable: Formal audit report with findings

- [ ] **Penetration Testing**
  - Focus: Backend API, authentication flows, authorization
  - Scope: OWASP Top 10, business logic, rate limiting bypasses
  - Deliverable: Penetration test report with remediation guidance

- [ ] **Libsignal Migration Evaluation**
  - Assess feasibility of migrating to libsignal-client
  - Document migration path and breaking changes
  - Decision: Migrate or continue with audited custom implementation

---

## Phase 3: Production Hardening (2026)

**Goal**: Production-ready security with ongoing maintenance.

### Planned

- [ ] Bug bounty program launch (HackerOne or similar)
- [ ] Security.txt and responsible disclosure policy
- [ ] SOC 2 Type II compliance evaluation
- [ ] Post-quantum cryptography migration plan
  - Hybrid approach: ECDH + ML-KEM (Kyber)
  - Timeline dependent on browser/platform support

---

## Threat Model

### In Scope

- Passive network eavesdropping → **Mitigated** (TLS 1.3 + E2EE)
- Server compromise → **Mitigated** (zero-knowledge, E2EE)
- Message tampering → **Mitigated** (AES-GCM authentication)
- Session hijacking → **Mitigated** (short-lived JWTs, refresh rotation)
- Brute force attacks → **Mitigated** (rate limiting, 2FA, Argon2id)

### Partially Addressed

- Key compromise on device → **Partial** (forward secrecy limits damage)
- Metadata analysis → **Partial** (server sees who talks to whom)
- Device compromise → **Out of scope** (device security is user responsibility)

### Out of Scope (Currently)

- Rubber hose cryptanalysis
- Nation-state adversaries with targeted attacks
- Quantum computing attacks (placeholder hybrid key only)

---

## How to Contribute

Security researchers are welcome to:

1. **Review our code**: [GitHub Repository](https://github.com/bluscreams/CGraph)
2. **Report vulnerabilities**: security@cgraph.dev
3. **Discuss security architecture**: Open a GitHub Discussion

We follow responsible disclosure:

- 90-day disclosure timeline for critical issues
- Credit given in release notes (unless anonymity requested)
- No legal action for good-faith security research

---

## Version History

| Date       | Version | Changes                     |
| ---------- | ------- | --------------------------- |
| 2025-01-22 | 1.0     | Initial roadmap publication |

---

> **Note**: This roadmap represents our current plans and may change based on priorities, resources,
> and community feedback. We're committed to transparency about our security posture.
