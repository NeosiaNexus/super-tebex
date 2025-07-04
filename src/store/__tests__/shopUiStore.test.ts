import { vi } from 'vitest';
import useShopUiStore from '../shopUiStore';

beforeEach(() => {
  vi.clearAllMocks();
  useShopUiStore.setState({
    isGlobalLoading: false,
    isCreatingBasket: false,
  });
});

describe('useShopUiStore', () => {
  describe('initial state', () => {
    it('should initialize with both loading flags set to false', () => {
      const state = useShopUiStore.getState();
      expect(state.isGlobalLoading).toBe(false);
      expect(state.isCreatingBasket).toBe(false);
    });
  });

  describe('state mutations', () => {
    it('should toggle isGlobalLoading via setIsGlobalLoading', () => {
      const { setIsGlobalLoading } = useShopUiStore.getState();

      setIsGlobalLoading(true);
      expect(useShopUiStore.getState().isGlobalLoading).toBe(true);

      setIsGlobalLoading(false);
      expect(useShopUiStore.getState().isGlobalLoading).toBe(false);
    });

    it('should toggle isCreatingBasket via setIsCreatingBasket', () => {
      const { setIsCreatingBasket } = useShopUiStore.getState();

      setIsCreatingBasket(true);
      expect(useShopUiStore.getState().isCreatingBasket).toBe(true);

      setIsCreatingBasket(false);
      expect(useShopUiStore.getState().isCreatingBasket).toBe(false);
    });

    it('should accept null as value (edge case)', () => {
      const { setIsGlobalLoading } = useShopUiStore.getState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsGlobalLoading(null as any);
      expect(useShopUiStore.getState().isGlobalLoading).toBe(null);
    });
  });

  describe('performance and optimization', () => {
    it('should handle 1,000 updates without performance issues', () => {
      const { setIsGlobalLoading, setIsCreatingBasket } = useShopUiStore.getState();

      const start = performance.now();
      for (let i = 0; i < 1_000; i++) {
        setIsGlobalLoading(i % 2 === 0);
        setIsCreatingBasket(i % 2 !== 0);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should not trigger re-renders when value does not change', () => {
      const onRender = vi.fn();

      const unsubscribe = useShopUiStore.subscribe(state => state.isGlobalLoading, onRender, {
        equalityFn: Object.is,
      });

      // State already false → this should not trigger render
      useShopUiStore.getState().setIsGlobalLoading(false);
      expect(onRender).not.toHaveBeenCalled();

      unsubscribe();
    });
  });
});
