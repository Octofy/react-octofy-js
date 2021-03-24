import React, {
  createContext,
  FC,
  useEffect,
  useMemo,
  useState,
  useRef,
  useContext,
} from 'react';
import OctofyJs from '@octofy/octofy-js';

interface OctofyContextValue {
  octofy: OctofyJs.Octofy | null;
}

interface OctofyProviderProps {
  octofy: PromiseLike<OctofyJs.Octofy | null> | OctofyJs.Octofy | null;
}

const OctofyContext = createContext<OctofyContextValue | null>(null);

export const OctofyProvider: FC<OctofyProviderProps> = ({
  children,
  octofy,
}) => {
  const final = useRef(false);
  const isMounted = useRef(true);
  const [ctx, setCtx] = useState<OctofyContextValue>({ octofy: null });
  const parsed = useMemo(() => parseOctofyProp(octofy), [octofy]);

  if (!final.current) {
    if (parsed.type === 'sync') {
      setCtx({ octofy: parsed.octofy });
    }

    if (parsed.type === 'async') {
      final.current = true;
      parsed.octofyPromise.then(octofy => {
        if (octofy && isMounted.current) {
          setCtx({ octofy });
        }
      });
    }
  }

  useEffect(() => {
    return (): void => {
      isMounted.current = false;
    };
  }, []);

  return (
    <OctofyContext.Provider value={ctx}>{children}</OctofyContext.Provider>
  );
};

type ParsedOctofyProp =
  | { type: 'empty' }
  | { type: 'async'; octofyPromise: Promise<OctofyJs.Octofy | null> }
  | { type: 'sync'; octofy: OctofyJs.Octofy };

const parseOctofyProp = (raw: unknown): ParsedOctofyProp => {
  if (isPromise(raw)) {
    return {
      type: 'async',
      octofyPromise: Promise.resolve(raw).then(validateOctofy),
    };
  }

  const octofy = validateOctofy(raw);

  if (octofy === null) {
    return { type: 'empty' };
  }

  return { type: 'sync', octofy };
};

const validateOctofy = (maybeOctofy: unknown): null | OctofyJs.Octofy => {
  if (maybeOctofy === null || isOctofy(maybeOctofy)) {
    return maybeOctofy;
  }

  throw new Error('Error');
};

const isUnknownObject = (
  raw: unknown
): raw is { [key in PropertyKey]: unknown } => {
  return raw !== null && typeof raw === 'object';
};

const isPromise = (raw: unknown): raw is PromiseLike<unknown> => {
  return isUnknownObject(raw) && typeof raw.then === 'function';
};

const isOctofy = (raw: unknown): raw is OctofyJs.Octofy => {
  return isUnknownObject(raw) && typeof raw.variation === 'function';
};

export const useVariation = (
  featureKey: string,
  targetKey: string,
  defaultValue: any
): { variation: any; loading: boolean } => {
  const { octofy } = useOctofyContext();
  const [variation, setVariation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const res = await octofy?.variation(featureKey, targetKey, defaultValue);
      setLoading(false);
      setVariation(res);
    };
    fetch();
  }, []);

  return { variation, loading };
};

export const useTarget = () => {
  return { register };
};

interface GroupOptions {
  $name?: string;
  $email?: string;
  $avatar?: string;
  $firstName?: string;
  $lastName?: string;
}

const register = async (
  groupKey: string,
  targetKey: string,
  options?: GroupOptions
): Promise<void> => {
  const { octofy } = useOctofyContext();
  octofy?.register(groupKey, targetKey, options);
};

const useOctofyContext = () => {
  const ctx = useContext(OctofyContext);
  return parseOctofyContext(ctx);
};

const parseOctofyContext = (ctx: OctofyContextValue | null) => {
  if (!ctx)
    throw new Error(
      'Could not find Octofy context. You need to wrap a <OctofyProvider>'
    );
  return ctx;
};
