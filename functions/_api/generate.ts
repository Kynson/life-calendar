import { template } from './template';

export function onRequestGet() {
  return new Response(template);
}