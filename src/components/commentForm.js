import React from 'react';
import firebase from 'firebase/app';
import axios from 'axios';
import config from '../../.firebaseConfig';
import 'firebase/auth';
import '../styles/comment-form.scss';

class CommentForm extends React.Component {
	constructor(props) {
		super(props);

		if (!firebase.apps.length) {
			firebase.initializeApp(config);
		}

		this.state = {
			textarea: '',
			token: ''
		}
	}

	componentDidMount() {
		const token = localStorage.getItem('firebase-token');
		if (!token) {
			const signIn = localStorage.getItem('firebase-sign-in');

			if (signIn) {
				this._getToken().then(() => console.log('TOKEN from componentDidMount', this.state.token));
				localStorage.removeItem('firebase-sign-in');
			}
		} else {
			this.setState({ token });
		}
	}

	githubAuth = () => {
		localStorage.setItem('firebase-sign-in', true);
		const provider = new firebase.auth.GithubAuthProvider();
		provider.addScope('repo');
		firebase.auth().signInWithRedirect(provider);
	}

	_getToken = () => {
		return new Promise((resolve, reject) => {
			firebase.auth().getRedirectResult().then(result => {
				if (result.credential) {
					const token = result.credential.accessToken;
					this.setState({ token });
					localStorage.setItem('firebase-token', token);
					return resolve();
				}
				reject('1st reject');
			}).catch(error => {
				reject('2nd reject');
			});
		});
	}

	handleChange = (e) => {
		this.setState({textarea: e.target.value})
	}

	sendComment = (e) => {
		const text = this.state.textarea;
		if (!text) {
			return;
		}
		const props = this.props;
		e.preventDefault();
		this.setState({ textarea: '' });
		document.querySelector('.comment-form').value = '';
		axios.post(
			`https://api.github.com/repos/${props.ghUser}/${props.ghRepo}/issues/${props.issueId}/comments`, 
			{
				body: text
			},
			{
				headers: {
					Authorization: `token ${this.state.token}`
				}
			}
		).then(response => {
			console.log('RESPONSE.DATA', response.data);
			this.props.addComment(response.data);
		}).catch(error => {
			if (error.response.status === 401) {
				localStorage.removeItem('firebase-token');
				localStorage.removeItem('firebase-sign-in');
				this.setState({ token: '' });
			}
			console.log('error', error);
		});
	}

	// renderMarkdown = (e) => {
	// 	this.state.textarea
	// }

	render() {
		return (
			<div>
				<textarea
					className="comment-form"
					value={this.state.value}
					onChange={this.handleChange}
					disabled={!this.state.token}
				>
				</textarea>
				{
					!this.state.token ? 
					<button 
						className="comment-form__sign-in"
						onClick={this.githubAuth}
					>
						Sign in
					</button>
					:
					<button
						className="comment-form__add-comment"
						onClick={this.sendComment}
						disabled={!this.state.textarea}
					>
						Comment
					</button>
				}
			</div>
		);
	}
}

export default CommentForm;
