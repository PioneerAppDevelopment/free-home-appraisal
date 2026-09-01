import React from 'react';
import '../contactform.scss';
import Logo from '../components/Logo';
import ContactApi from '../services/contactApi';

/** Components */
const Card = props => (
  <div className="contact-form-card">
    {/*<div className="waves">
    </div>*/}
    {props.children}
  </div>
);

const Form = props => (
  <form className="contact-form-form" onSubmit={props.onSubmit}>{props.children}</form>
);

const TextInput = props => (
  <div
    className="contact-form-text-input">
    <label
      className={(props.focus || props.value !== '') ? 'label-focus' : ''}
      htmlFor={props.name}>{props.label}</label>
    <input
      className={(props.focus || props.value !== '') ? 'input-focus' : ''}
      type={props.type || 'text'}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      onInput={props.onInput}
      onFocus={props.onFocus}
      onBlur={props.onBlur} />
  </div>
);

const TextArea = props => (
  <div
    className="contact-form-text-area">
    <label
      className={(props.focus || props.value !== '') ? 'label-focus' : ''}
      htmlFor={props.name}>{props.label}</label>
    <textarea
      className={(props.focus || props.value !== '') ? 'input-focus' : ''}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      onInput={props.onInput}
      onFocus={props.onFocus}
      onBlur={props.onBlur} />
  </div>
);

const Button = props => (
  <button
    className="contact-form-button"
    disabled={props.disabled}
    type="submit">{props.children}</button>
);

/** Root Component */
class ContactContent extends React.Component {
  constructor() {
    super();
    this.state = {
      name: {
        name: 'name',
        label: 'Name',
        value: '',
        focus: false,
      },
      email: {
        name: 'email',
        label: 'Email',
        value: '',
        focus: false,
      },
      message: {
        name: 'message',
        label: 'Message',
        value: '',
        focus: false,
      },
      isSubmitting: false,
      submitStatus: '',
      submitError: '',
    }
  }

  handleFocus(e) {
    const name = e.target.name;
    const state = Object.assign({}, this.state[name]);
    state.focus = true;
    this.setState({ [name]: state });
  }

  handleBlur(e) {
    const name = e.target.name;
    const state = Object.assign({}, this.state[name]);
    state.focus = false;
    this.setState({ [name]: state });
  }

  handleChange(e) {
    const name = e.target.name;
    const state = Object.assign({}, this.state[name]);
    state.value = e.target.value;
    this.setState({ [name]: state });
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.setState({ isSubmitting: true, submitStatus: '', submitError: '' });

    try {
      await ContactApi.sendMessage({
        name: this.state.name.value,
        email: this.state.email.value,
        message: this.state.message.value,
      });

      this.setState({
        name: { ...this.state.name, value: '' },
        email: { ...this.state.email, value: '' },
        message: { ...this.state.message, value: '' },
        isSubmitting: false,
        submitStatus: 'Thanks, your message has been sent.',
      });
    } catch (error) {
      this.setState({
        isSubmitting: false,
        submitError: error.message || 'Message could not be sent.',
      });
    }
  }

  render() {
    const { name, email, message, isSubmitting, submitStatus, submitError } = this.state;
    return (
      <div className="contact-form-container">
        <div className="logo-container">
          <Logo />
        </div>
        <Card>
          <h1>Send us a Message!</h1>
          <p style={{padding: 20}}>Please fill out the form below if you have any questions, issues, or suggestions.</p>
          <Form onSubmit={this.handleSubmit.bind(this)}>
            <TextInput
              {...name}
              onFocus={this.handleFocus.bind(this)}
              onBlur={this.handleBlur.bind(this)}
              onChange={this.handleChange.bind(this)} />
            <TextInput
              {...email}
              type="email"
              onFocus={this.handleFocus.bind(this)}
              onBlur={this.handleBlur.bind(this)}
              onChange={this.handleChange.bind(this)} />
            <TextArea
              {...message}
              onFocus={this.handleFocus.bind(this)}
              onBlur={this.handleBlur.bind(this)}
              onChange={this.handleChange.bind(this)} />
            {submitStatus ? <p className="contact-form-status success">{submitStatus}</p> : null}
            {submitError ? <p className="contact-form-status error">{submitError}</p> : null}
            <Button disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send'}</Button>
          </Form>
        </Card>
      </div>
    );
  }
}

export default ContactContent;
