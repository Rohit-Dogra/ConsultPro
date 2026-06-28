
// Extend window interface for THREE.js animation frame ID
interface Window {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
}

// Add animation-related custom CSS properties
interface CSSStyleDeclaration {
  animationDelay: string;
  animationFillMode: string;
}

// Allow SVG attribute access
interface SVGElement extends Element {
  style: CSSStyleDeclaration;
}
