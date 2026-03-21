import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Typography, Space, Checkbox } from 'antd';
import {
  QuestionCheckboxDefaultProps,
  QuestionCheckboxPropsType,
} from './interface';

const { Paragraph } = Typography;

const QuestionCheckbox: FC<QuestionCheckboxPropsType> = (props) => {
  const {
    title,
    isVertical,
    autoVertical,
    options = [],
  } = {
    ...QuestionCheckboxDefaultProps,
    ...props,
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isAutoVertical, setIsAutoVertical] = useState<boolean>(false);

  const measureWrapped = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const items = wrapper.querySelectorAll<HTMLElement>('.ant-space-item');
    if (items.length <= 1) {
      setIsAutoVertical(false);
      return;
    }

    const firstTop = items[0]?.offsetTop;
    if (firstTop == null) {
      setIsAutoVertical(false);
      return;
    }

    let wrapped = false;
    items.forEach((el) => {
      if (el.offsetTop !== firstTop) wrapped = true;
    });

    setIsAutoVertical((prev) => (prev === wrapped ? prev : wrapped));
  }, []);

  useLayoutEffect(() => {
    if (isVertical) return;
    if (autoVertical === false) return;
    const rafId = window.requestAnimationFrame(measureWrapped);
    return () => window.cancelAnimationFrame(rafId);
  }, [autoVertical, isVertical, measureWrapped, options]);

  useEffect(() => {
    if (isVertical) return undefined;
    if (autoVertical === false) return undefined;
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const ro = new ResizeObserver(() => {
      measureWrapped();
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [autoVertical, isVertical, measureWrapped]);

  const finalIsVertical = Boolean(
    isVertical || (autoVertical !== false && isAutoVertical)
  );
  return (
    <div>
      <Paragraph strong>{title}</Paragraph>
      <div ref={wrapperRef}>
        <Space
          direction={finalIsVertical ? 'vertical' : 'horizontal'}
          wrap={!finalIsVertical}
        >
          {options.map((opt) => {
            const { value, text, checked } = opt;
            return (
              <Checkbox key={value} value={value} checked={checked}>
                {text}
              </Checkbox>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

export default QuestionCheckbox;
