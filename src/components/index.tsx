import QuestionInput from "./QuestionInput";
import QuestionRadio from "./QuestionRadio";
import QuestionInfo from "./QuestionInfo";
import QuestionTitle from "./QuestionTitle";
import QuestionParagraph from "./QuestionParagraph";
import QuestionTextarea from "./QuestionTextarea";
import QuestionCheckbox from "./QuestionCheckbox";

type QuestionInputProps = {
  title: string;
  placeholder: string;
};

type QuestionRadioProps = {
  title: string;
  options: Array<{ value: string; text: string }>;
  value: string;
  isVertical: boolean;
};

type QuestionCheckboxProps = {
  title: string;
  isVertical?: boolean;
  options: Array<{ value: string; text: string; checked: boolean }>;
};

type QuestionTextareaProps = {
  title: string;
  placeholder?: string;
};

type QuestionInfoProps = {
  title: string;
  desc?: string;
};

type QuestionTitleProps = {
  text: string;
  level: number;
  isCenter?: boolean;
};

type QuestionParagraphProps = {
  text: string;
  isCenter?: boolean;
};

type ComponentInfoType =
  | {
      fe_id: string;
      type: "questionInput";
      isHidden: boolean;
      props: QuestionInputProps;
    }
  | {
      fe_id: string;
      type: "questionRadio";
      isHidden: boolean;
      props: QuestionRadioProps;
    }
  | {
      fe_id: string;
      type: "questionCheckbox";
      isHidden: boolean;
      props: QuestionCheckboxProps;
    }
  | {
      fe_id: string;
      type: "questionTextarea";
      isHidden: boolean;
      props: QuestionTextareaProps;
    }
  | {
      fe_id: string;
      type: "questionInfo";
      isHidden: boolean;
      props: QuestionInfoProps;
    }
  | {
      fe_id: string;
      type: "questionTitle";
      isHidden: boolean;
      props: QuestionTitleProps;
    }
  | {
      fe_id: string;
      type: "questionParagraph";
      isHidden: boolean;
      props: QuestionParagraphProps;
    };

export const getComponent = (comp: ComponentInfoType) => {
  if (comp.isHidden) return null;

  switch (comp.type) {
    case "questionInput":
      return <QuestionInput fe_id={comp.fe_id} props={comp.props} />;
    case "questionRadio":
      return <QuestionRadio fe_id={comp.fe_id} props={comp.props} />;
    case "questionCheckbox":
      return <QuestionCheckbox fe_id={comp.fe_id} props={comp.props} />;
    case "questionTextarea":
      return <QuestionTextarea fe_id={comp.fe_id} props={comp.props} />;
    case "questionInfo":
      return <QuestionInfo title={comp.props.title} desc={comp.props.desc} />;
    case "questionTitle":
      return <QuestionTitle {...comp.props} />;
    case "questionParagraph":
      return <QuestionParagraph {...comp.props} />;
    default:
      return null;
  }
};
