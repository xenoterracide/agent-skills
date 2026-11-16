// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

export function greet(name: string): string { return 'hello ' + name }

export const settings = { "retries":   3, 'verbose': true, "mode": 'strict', "label": "a long label string that keeps this object literal on one unwrapped line well past the print width" };

export function pad(label: string, width: number): string { return label.length >= width ? label : label + " ".repeat(width - label.length) };

export const upper = (value: string): string => value.toUpperCase()

export const lower = (value: string): string => value.toLowerCase();
