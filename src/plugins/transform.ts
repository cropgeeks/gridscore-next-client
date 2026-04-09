// @ts-nocheck

import { Matrix, solve } from 'ml-matrix'
import type { XY } from '@/plugins/location'

function applyTransform (tr: Matrix, x: number, y: number) {
  const applied = tr.mmul(new Matrix([[x], [y], [0], [1]]))
  const w = applied.get(3, 0)
  return {
    x: applied.get(0, 0) / w,
    y: applied.get(1, 0) / w,
  }
}

function calculateTransform (from: XY[], to: XY[]) {
  const A = []
  let i, _i, _j
  for (i = _i = 0; _i < 4; i = ++_i) {
    A.push([
      from[i].x,
      from[i].y,
      1,
      0,
      0,
      0,
      -from[i].x * to[i].x,
      -from[i].y * to[i].x,
    ], [
      0,
      0,
      0,
      from[i].x,
      from[i].y,
      1,
      -from[i].x * to[i].y,
      -from[i].y * to[i].y,
    ])
  }
  const b = []
  for (i = _j = 0; _j < 4; i = ++_j) {
    b.push([to[i].x], [to[i].y])
  }
  const h = solve(A, b)
  const H = new Matrix([[
    h.get(0, 0),
    h.get(1, 0),
    0,
    h.get(2, 0),
  ], [
    h.get(3, 0),
    h.get(4, 0),
    0,
    h.get(5, 0),
  ], [
    0,
    0,
    1,
    0,
  ], [
    h.get(6, 0),
    h.get(7, 0),
    0,
    1,
  ]])
  return H
}

function calculateTransformation (from: XY[], to: XY[]) {
  const H = calculateTransform(from, to)
  const transformation = applyTransform.bind(null, H)
  transformation.H = H
  return transformation
}

export {
  calculateTransformation,
}
